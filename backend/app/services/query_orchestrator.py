from __future__ import annotations

from dataclasses import dataclass, field
import re
from typing import Dict, Generator, List, Optional

from app.services.llm_providers import LLMFactory
from app.services.rag_service import RAGService
from app.services.utils import load_cfg


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

CHAT_SYSTEM_PROMPT = (
    "Είσαι μια γρήγορη βοηθός στα ελληνικά. "
    "Απάντησε σύντομα και ευγενικά, χωρίς να αναφέρεις περιορισμούς ή πρόσβαση σε έγγραφα. "
    "Μην επαναλαμβάνεις την ίδια φράση."
)

UNSAFE_RESPONSE = (
    "Η ερώτηση δεν μπορεί να απαντηθεί γιατί παραβιάζει τους κανόνες ασφαλείας."
)

OUT_OF_SCOPE_RESPONSE = (
    "Η ερώτηση δεν σχετίζεται με τον στρατιωτικό κανονισμό του συστήματος."
)

FALLBACK_RESPONSE = (
    "Δεν βρέθηκαν σχετικά έγγραφα. Παρακαλώ διευκρίνισε ή άλλαξε την ερώτηση."
)

VALID_LABELS = {"NEED_RAG", "NO_RAG", "OUT_OF_SCOPE", "UNSAFE"}
GREETINGS = ("γεια", "γειά", "χαίρετε", "hello", "hi", "hey", "καλημέρα", "καλησπέρα", "καληνύχτα")


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
    """Route queries between chat model and RAG pipeline."""

    def __init__(self, cfg_path: str):
        self.cfg_path = cfg_path
        self.cfg = load_cfg(cfg_path)

        self.rag_service = RAGService(cfg_path)

        router_cfg = self.cfg.get("router", {})
        self.router_enabled = router_cfg.get("enabled", True)
        self.min_score = router_cfg.get("min_score", 0.4)
        self.router_llm = None
        router_llm_cfg = router_cfg.get("llm")
        if self.router_enabled and router_llm_cfg:
            self.router_llm = LLMFactory(**router_llm_cfg)

        chat_llm_cfg = self.cfg.get("chat_llm")
        self.chat_llm = LLMFactory(**chat_llm_cfg) if chat_llm_cfg else None

    def _dedupe_sentences(self, text: str) -> str:
        """Remove immediate duplicate sentences to avoid stuttering."""
        parts = re.split(r"(?<=[.!;?])\s*", text.strip())
        seen = set()
        deduped = []
        for part in parts:
            if not part:
                continue
            normalized = part.strip()
            if normalized and normalized not in seen:
                deduped.append(normalized)
                seen.add(normalized)
        return " ".join(deduped)

    def _classify_query(self, question: str) -> str:
        if not self.router_llm:
            return "NEED_RAG"

        result = self.router_llm.answer(
            CLASSIFY_SYSTEM_PROMPT,
            CLASSIFY_PROMPT.format(question=question),
        )
        label = (result or "").strip().upper()
        if label not in VALID_LABELS:
            return "NEED_RAG"
        return label

    def _chat_response(self, question: str, label: str) -> str:
        if not self.chat_llm:
            return FALLBACK_RESPONSE

        prompt = (
            f"Κατηγορία αιτήματος: {label}.\n"
            f"Ερώτηση: {question}\n"
            "Απάντησε συνοπτικά στα ελληνικά, χωρίς να αναφέρεσαι σε πρόσβαση στα έγγραφα ή σε περιορισμούς, "
            "και χωρίς να επαναλαμβάνεις τον εαυτό σου."
        )
        answer = self.chat_llm.answer(CHAT_SYSTEM_PROMPT, prompt)
        return self._dedupe_sentences(answer)

    def _is_greeting(self, question: str) -> bool:
        q = question.strip().lower()
        return any(q.startswith(greet) or greet in q for greet in GREETINGS)

    def plan_question(self, question: str) -> QueryPlan:
        label = self._classify_query(question) if self.router_enabled else "NEED_RAG"

        if label == "UNSAFE":
            return QueryPlan(question=question, mode="unsafe", label=label, message=UNSAFE_RESPONSE)
        if label == "OUT_OF_SCOPE":
            return QueryPlan(
                question=question,
                mode="out_of_scope",
                label=label,
                message=OUT_OF_SCOPE_RESPONSE,
            )
        if label != "NEED_RAG":
            return QueryPlan(question=question, mode="chat", label=label)

        ctx_texts, scores, metas = self.rag_service.retrieve(question)
        if not ctx_texts:
            return QueryPlan(
                question=question,
                mode="chat",
                label="NO_CONTEXT",
                message=FALLBACK_RESPONSE,
            )

        max_score = max(scores) if scores else 0.0
        if max_score < self.min_score:
            return QueryPlan(
                question=question,
                mode="chat",
                label="LOW_CONFIDENCE",
                message=FALLBACK_RESPONSE,
            )

        return QueryPlan(
            question=question,
            mode="rag",
            label=label,
            ctx_texts=ctx_texts,
            scores=scores,
            metas=metas,
        )

    def fulfill_plan(self, plan: QueryPlan) -> QueryOutcome:
        if plan.mode == "rag":
            answer, ctx, scores, metas = self.rag_service.answer(
                plan.question,
                ctx_texts=plan.ctx_texts,
                scores=plan.scores,
                metas=plan.metas,
            )
            return QueryOutcome(answer, ctx, scores, metas, "rag", plan.label)

        if plan.mode == "chat":
            # If a message is already prepared, NEVER generate a new greeting
            if plan.message:
                answer = self._dedupe_sentences(plan.message)
            elif self._is_greeting(plan.question):
                answer = "Καλησπέρα! Πώς μπορώ να βοηθήσω;"
            else:
                answer = self._chat_response(plan.question, plan.label)
            return QueryOutcome(answer, [], [], [], "chat", plan.label)
            return QueryOutcome(answer, [], [], [], "chat", plan.label)

        if plan.mode == "unsafe":
            return QueryOutcome(plan.message or UNSAFE_RESPONSE, [], [], [], "unsafe", plan.label)

        if plan.mode == "out_of_scope":
            return QueryOutcome(
                plan.message or OUT_OF_SCOPE_RESPONSE,
                [],
                [],
                [],
                "out_of_scope",
                plan.label,
            )

        # Fallback to chat behavior
        answer = self._dedupe_sentences(plan.message or FALLBACK_RESPONSE)
        return QueryOutcome(answer, [], [], [], "chat", plan.label)

    def answer_question(self, question: str) -> QueryOutcome:
        plan = self.plan_question(question)
        return self.fulfill_plan(plan)

    def stream_plan(self, plan: QueryPlan) -> Generator[str, None, None]:
        if plan.mode != "rag":
            outcome = self.fulfill_plan(plan)
            yield outcome.answer
            return

        yield from self.rag_service.stream_answer(
            plan.question,
            ctx_texts=plan.ctx_texts,
            scores=plan.scores,
            metas=plan.metas,
        )
