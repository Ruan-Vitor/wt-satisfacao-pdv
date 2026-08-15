"""
============================================================
  WT Satisfação PDV — gerar_pdf_guia.py
  Versão: 1.0 | Agosto 2026

  O QUE FAZ:
  - Converte o GUIA_COMPLETO.md em GUIA_COMPLETO.pdf
  - Usa o Chrome instalado na máquina para imprimir o PDF
    (mesmo caminho usado na versão anterior do guia)

  COMO USAR:
      python gerar_pdf_guia.py
============================================================
"""

import os
import subprocess
import sys
import tempfile
import time
from urllib.request import pathname2url

import markdown

BASE = os.path.dirname(os.path.abspath(__file__))
MD = os.path.join(BASE, "GUIA_COMPLETO.md")
PDF = os.path.join(BASE, "GUIA_COMPLETO.pdf")

NAVEGADORES = [
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

CSS = """
@page { size: A4; margin: 16mm 14mm; }
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', 'Barlow', Arial, sans-serif;
  font-size: 10.5pt; line-height: 1.55; color: #1a2340; margin: 0;
}
h1 {
  font-size: 21pt; color: #1a2848; margin: 0 0 2px; line-height: 1.2;
  border-bottom: 3px solid #e8c84a; padding-bottom: 8px;
}
h2 {
  font-size: 14pt; color: #1a2848; margin: 26px 0 10px;
  border-bottom: 1px solid #e2e6f0; padding-bottom: 5px;
  page-break-after: avoid;
}
h1 + h2 { border: none; color: #5a6482; font-size: 12pt; font-weight: 600; margin-top: 6px; }
h3 { font-size: 11.5pt; color: #243562; margin: 18px 0 7px; page-break-after: avoid; }
p { margin: 7px 0; }
ul, ol { margin: 7px 0 7px 20px; padding: 0; }
li { margin: 3px 0; }
strong { color: #1a2848; }
a { color: #2f447a; text-decoration: none; word-break: break-all; }
hr { border: none; border-top: 1px solid #e2e6f0; margin: 22px 0; }
blockquote {
  margin: 10px 0; padding: 8px 14px; background: #f4f6fc;
  border-left: 3px solid #e8c84a; color: #5a6482;
}
blockquote p { margin: 3px 0; }
code {
  font-family: 'Consolas', 'Courier New', monospace; font-size: 9.5pt;
  background: #f0f2f8; padding: 1px 5px; border-radius: 4px; color: #243562;
}
pre {
  background: #1a2848; color: #f4f6fc; padding: 11px 14px; border-radius: 8px;
  overflow: hidden; white-space: pre-wrap; word-break: break-word;
  page-break-inside: avoid; margin: 10px 0;
}
pre code { background: none; color: inherit; padding: 0; font-size: 9pt; }
table {
  width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 9.5pt;
  page-break-inside: avoid;
}
th {
  background: #1a2848; color: #fff; text-align: left; font-weight: 600;
  padding: 6px 9px; border: 1px solid #1a2848;
}
td { padding: 6px 9px; border: 1px solid #e2e6f0; vertical-align: top; }
tr:nth-child(even) td { background: #f8f9fd; }
em { color: #5a6482; }
"""


def achar_navegador():
    for caminho in NAVEGADORES:
        if os.path.exists(caminho):
            return caminho
    return None


def main():
    if not os.path.exists(MD):
        sys.exit(f"Nao encontrei {MD}")

    navegador = achar_navegador()
    if not navegador:
        sys.exit("Chrome/Edge nao encontrado. Instale o Chrome ou gere o PDF manualmente.")

    texto = open(MD, encoding="utf-8").read()
    corpo = markdown.markdown(
        texto, extensions=["tables", "fenced_code", "sane_lists", "nl2br"]
    )
    html = (
        '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">'
        "<title>WT Satisfacao PDV — Guia Completo</title>"
        f"<style>{CSS}</style></head><body>{corpo}</body></html>"
    )

    tmp = os.path.join(tempfile.gettempdir(), "wt_guia_tmp.html")
    with open(tmp, "w", encoding="utf-8") as f:
        f.write(html)

    print(f"  navegador: {navegador}")
    print(f"  gerando:   {PDF}")

    subprocess.run(
        [
            navegador,
            "--headless=new",
            "--disable-gpu",
            "--no-pdf-header-footer",
            "--run-all-compositor-stages-before-draw",
            "--virtual-time-budget=6000",
            f"--print-to-pdf={PDF}",
            "file:///" + pathname2url(tmp).lstrip("/"),
        ],
        check=False,
    )

    time.sleep(1)
    if os.path.exists(PDF):
        tam = os.path.getsize(PDF) / 1024
        print(f"\n  ok  GUIA_COMPLETO.pdf gerado ({tam:.0f} KB)")
    else:
        sys.exit("Falhou: o PDF nao foi criado.")

    try:
        os.remove(tmp)
    except OSError:
        pass


if __name__ == "__main__":
    main()
