"""
Web Scrapers - Sistema Modular de Scraping
"""

__version__ = "1.0.0"
__author__ = "MuriloDEV"

from .iarremate_scraper import IArremateScraper
from .leiloes_br_scraper import LeiloesBRScraper
from .base_scraper import BaseScraper

__all__ = ['IArremateScraper', 'LeiloesBRScraper', 'BaseScraper']

