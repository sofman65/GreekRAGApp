from __future__ import annotations

from langchain_ollama import ChatOllama


class LLMFactory:
    """Simple factory to standardise access to chat models."""

    def __init__(
        self,
        provider: str,
        model: str,
        temperature: float = 0.1,
        max_tokens: int | None = None,
        **_: object,
    ):
        self.provider = provider
        self.model = model
        self.temperature = temperature
        self.max_tokens = max_tokens
        model_kwargs = {}
        if max_tokens is not None:
            model_kwargs["num_predict"] = max_tokens

        if provider == "ollama":
            kwargs = {"model": model, "temperature": temperature}
            if model_kwargs:
                kwargs["model_kwargs"] = model_kwargs
            self._llm = ChatOllama(**kwargs)
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
