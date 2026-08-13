from django.urls import path

from .views import AskLLM, AskLLMStream


urlpatterns = [
    path('ask/', AskLLM.as_view(), name='ask_llm'),
    path('stream/', AskLLMStream.as_view(), name='ask_llm_stream'),
]
