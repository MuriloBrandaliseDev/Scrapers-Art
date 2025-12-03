#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para iniciar a API FastAPI
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Desabilitado para produção
        log_level="info"
    )

