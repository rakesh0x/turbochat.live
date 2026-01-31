import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import json
import unicodedata
import re
from pinecone import Pinecone
from langchain_text_splitters import RecursiveCharacterTextSplitter
from scraper.fetch_html import get_data
from dotenv import load_dotenv
load_dotenv()


