from __future__ import annotations

from langchain_ollama import ChatOllama


class LLMFactory:
    """Simple factory to standardise access to chat models."""

    def __init__(self, provider: str, model: str, temperature: float = 0.1):
        self.provider = provider
        self.model = model
        self.temperature = temperature

        if provider == "ollama":
            self._llm = ChatOllama(model=model, temperature=temperature)
        elif provider == "gptoss":
            raise NotImplementedError(
                "GPT-OSS provider not yet implemented. Plug your client here."
            )
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")

    def answer(self, system_prompt: str, user_prompt: str) -> str:
        messages = [
            ("system", system_prompt),
            ("human", user_prompt),
        ]
        return self._llm.invoke(messages).content
    
    def stream_answer(self, system_prompt: str, user_prompt: str):
        """Stream answer tokens from the LLM."""
        messages = [
            ("system", system_prompt),
            ("human", user_prompt),
        ]
        for chunk in self._llm.stream(messages):
            if hasattr(chunk, 'content'):
                yield chunk.content
