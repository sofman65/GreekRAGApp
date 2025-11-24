from __future__ import annotations
from dataclasses import dataclass, field
import re
from typing import Dict, Generator, List, Optional

from app.services.llm_providers import LLMFactory
from app.services.rag_service import RAGService
from app.services.utils import load_cfg


# ------------------------------- SYSTEM PROMPTS ---------------------------------

CLASSIFY_SYSTEM_PROMPT = (
    "You are a security-focused routing assistant for a military knowledge base. "
    "Always return ONLY one of the allowed labels."
)

CLASSIFY_PROMPT = (
    "Classify the following user query into one of these labels:\n"
    "- NEED_RAG (requires factual answer sourced from the knowledge base)\n"
    "- NO_RAG (general reasoning, creative or conversational request)\n"
    "- OUT_OF_SCOPE (unrelated to the mission domain)\n"
    "- UNSAFE (policy or security violating request)\n\n"
    "Return only the label.\n\n"
    "Query: {question}"
)

META_CHECK_PROMPT = """
Is the following query asking about the assistant itself,
its abilities, its operation, its knowledge, its limitations,
or why it can help the user?

Respond ONLY with YES or NO.

Query: {q}
"""

CHAT_SYSTEM_PROMPT = (
    "Είσαι μια γρήγορη βοηθός που απαντά ΑΠΟΚΛΕΙΣΤΙΚΑ στα ελληνικά. "
    "Απάντησε σύντομα, απλά και καθαρά, χωρίς αρχαϊσμούς, χωρίς υπερβολική ευγένεια, "
    "χωρίς λογοτεχνικό ύφος, χωρίς γενικότητες και χωρίς ηθικολογίες. "
    "Μην αναφέρεις ποτέ συστήματα, αρχεία, πρόσβαση σε δεδομένα ή περιορισμούς. "
    "Μην επαναλαμβάνεις την ίδια φράση."
)

UNSAFE_RESPONSE = "Η ερώτηση δεν μπορεί να απαντηθεί γιατί παραβιάζει τους κανόνες ασφαλείας."
OUT_OF_SCOPE_RESPONSE = "Η ερώτηση δεν σχετίζεται με τον στρατιωτικό κανονισμό του συστήματος."
FALLBACK_RESPONSE = "Δεν βρέθηκαν σχετικά έγγραφα. Παρακαλώ διευκρίνισε ή άλλαξε την ερώτηση."

VALID_LABELS = {"NEED_RAG", "NO_RAG", "OUT_OF_SCOPE", "UNSAFE"}

GREETINGS = (
    "γεια", "γειά", "χαίρετε", "hello", "hi", "hey",
    "καλημέρα", "καλησπέρα", "καληνύχτα"
)

# ---------------------------------------------------------------------------------


@dataclass
class QueryPlan:
    question: str
    mode: str
    label: str
    ctx_texts: List[str] = field(default_factory=list)
    scores: List[float] = field(default_factory=list)
    metas: List[Dict] = field(default_factory=list)
    message: Optional[str] = None


@dataclass
class QueryOutcome:
    answer: str
    ctx_texts: List[str]
    scores: List[float]
    metas: List[Dict]
    mode: str
    label: str


class QueryOrchestrator:
    """Route queries between chat model, router, and RAG."""

    def __init__(self, cfg_path: str):
        self.cfg = load_cfg(cfg_path)

        self.rag_service = RAGService(cfg_path)

        # Router
        router_cfg = self.cfg.get("router", {})
        self.router_enabled = router_cfg.get("enabled", True)
        self.min_score = router_cfg.get("min_score", 0.4)

        self.router_llm = None
        if self.router_enabled and router_cfg.get("llm"):
            self.router_llm = LLMFactory(**router_cfg["llm"])

        # Chat LLM
        chat_llm_cfg = self.cfg.get("chat_llm")
        self.chat_llm = LLMFactory(**chat_llm_cfg) if chat_llm_cfg else None

    # -------------------------------------------------------------------------
    # Helper functions
    # -------------------------------------------------------------------------

    def _dedupe_sentences(self, text: str) -> str:
        parts = re.split(r"(?<=[.!;?])\s*", text.strip())
        seen, deduped = set(), []
        for p in parts:
            if p and p not in seen:
                deduped.append(p)
                seen.add(p)
        return " ".join(deduped)

    def _is_greeting(self, question: str) -> bool:
        q = question.lower().strip()
        return any(q.startswith(g) or g in q for g in GREETINGS)

    def _is_meta(self, question: str) -> bool:
        """Semantic meta-question detection using router LLM."""
        if not self.router_llm:
            return False
        resp = self.router_llm.answer("", META_CHECK_PROMPT.format(q=question))
        if not resp:
            return False
        resp = resp.strip().upper()
        return resp.startswith("Y")

    # -------------------------------------------------------------------------
    # Main classification logic
    # -------------------------------------------------------------------------

    def _classify_query(self, question: str) -> str:

        # 1. Greetings → Always chat
        if self._is_greeting(question):
            return "NO_RAG"

        # 2. Meta questions → Always chat
        if self._is_meta(question):
            return "NO_RAG"

        # 3. Router LLM classification
        if not self.router_llm:
            return "NEED_RAG"

        result = self.router_llm.answer(
            CLASSIFY_SYSTEM_PROMPT,
            CLASSIFY_PROMPT.format(question=question),
        )

        label = (result or "").strip().upper()
        return label if label in VALID_LABELS else "NEED_RAG"

    # -------------------------------------------------------------------------
    # Chat handler
    # -------------------------------------------------------------------------

    def _chat_response(self, question: str, label: str) -> str:
        if not self.chat_llm:
            return FALLBACK_RESPONSE

        prompt = (
            f"Κατηγορία αιτήματος: {label}.\n"
            f"Ερώτηση: {question}\n"
            "Απάντησε στα ελληνικά ΜΟΝΟ, με φυσικό τόνο, σε 1-2 ολοκληρωμένες προτάσεις. "
            "Μην δίνεις μονολεκτικές απαντήσεις, μην αναφέρεσαι σε πρόσβαση στα έγγραφα ή σε περιορισμούς, "
            "και μην επαναλαμβάνεις τον εαυτό σου."
        )
        ans = self.chat_llm.answer(CHAT_SYSTEM_PROMPT, prompt)
        return self._dedupe_sentences(ans)

    # -------------------------------------------------------------------------
    # Planning
    # -------------------------------------------------------------------------

    def plan_question(self, question: str) -> QueryPlan:
        label = self._classify_query(question)

        if label == "UNSAFE":
            return QueryPlan(question, "unsafe", label, message=UNSAFE_RESPONSE)

        if label == "OUT_OF_SCOPE":
            return QueryPlan(question, "out_of_scope", label, message=OUT_OF_SCOPE_RESPONSE)

        if label != "NEED_RAG":
            return QueryPlan(question, "chat", label)

        # RAG retrieval
        ctx, scores, metas = self.rag_service.retrieve(question)
        if not ctx:
            return QueryPlan(question, "chat", "NO_CONTEXT", message=FALLBACK_RESPONSE)

        if max(scores or [0]) < self.min_score:
            return QueryPlan(question, "chat", "LOW_CONFIDENCE", message=FALLBACK_RESPONSE)

        return QueryPlan(question, "rag", label, ctx, scores, metas)

    # -------------------------------------------------------------------------
    # Fulfillment
    # -------------------------------------------------------------------------

    def fulfill_plan(self, plan: QueryPlan) -> QueryOutcome:

        if plan.mode == "rag":
            ans, ctx, scores, metas = self.rag_service.answer(
                plan.question, plan.ctx_texts, plan.scores, plan.metas
            )
            return QueryOutcome(ans, ctx, scores, metas, "rag", plan.label)

        if plan.mode == "chat":
            if plan.message:
                ans = plan.message
            else:
                ans = self._chat_response(plan.question, plan.label)
            return QueryOutcome(ans, [], [], [], "chat", plan.label)

        if plan.mode == "unsafe":
            return QueryOutcome(plan.message, [], [], [], "unsafe", plan.label)

        if plan.mode == "out_of_scope":
            return QueryOutcome(plan.message, [], [], [], "out_of_scope", plan.label)

        return QueryOutcome(FALLBACK_RESPONSE, [], [], [], "chat", plan.label)

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def answer_question(self, question: str) -> QueryOutcome:
        plan = self.plan_question(question)
        return self.fulfill_plan(plan)

    def stream_plan(self, plan: QueryPlan) -> Generator[str, None, None]:
        if plan.mode != "rag":
            yield self.fulfill_plan(plan).answer
            return

        for token in self.rag_service.stream_answer(
            plan.question, plan.ctx_texts, plan.scores, plan.metas
        ):
            yield token
