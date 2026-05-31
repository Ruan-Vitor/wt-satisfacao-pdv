"""
============================================================
  WT Satisfação PDV — inserir_testes.py
  Versão: 1.0 | Maio 2026

  O QUE FAZ:
  - Insere 40 respostas de teste realistas no Firebase
  - Variação de vendedores, marcas, notas, perfis, datas
  - Simula um mês de movimento real de loja

  COMO USAR:
  No terminal do VSCode (Ctrl+J):
      python inserir_testes.py

  DEPENDÊNCIAS:
      pip install requests
============================================================
"""

import requests
import json
import random
from datetime import datetime, timedelta

# ── CONFIGURAÇÃO ────────────────────────────────────────────
PROJECT_ID = "wt-satisfacao-pdv"
API_KEY    = "AIzaSyDwAL3IkbGaLXVFDZELIvrz5OTztKu2NHE"
URL        = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents/respostas?key={API_KEY}"

# ── DADOS REALISTAS ─────────────────────────────────────────
VENDEDORES   = ["João", "Maria", "Carlos", "Ana", "Pedro", "Lúcia"]
MARCAS       = ["Olympikus", "Mizuno", "Fila", "New Balance", "Asics",
                "Puma", "Under Armour", "Adidas", "Skechers", "Meias",
                "Limpa Tênis", "Outros (Hoka, Reebok…)"]
MODELOS      = {
    "Olympikus": ["Corre 4", "Corre 5", "Caminha", "Pró"],
    "Mizuno":    ["Wave Rider", "Wave Inspire", "Wave Creation", "Prophecy"],
    "Fila":      ["Speed Zone", "Racer", "F-13"],
    "New Balance":["Fresh Foam 1080", "574", "990v5", "880"],
    "Asics":     ["Gel-Kayano", "Gel-Nimbus", "Gel-Cumulus", "Gel-DS"],
    "Puma":      ["RS-X", "Velocity Nitro", "Deviate Elite"],
    "Under Armour":["HOVR Sonic", "Charged Assert", "Phantom 3"],
    "Adidas":    ["Ultraboost", "Samba", "Forum", "NMD"],
    "Skechers":  ["Go Walk", "D'Lites", "Max Cushioning"],
    "Meias":     [""],
    "Limpa Tênis":[""],
    "Outros (Hoka, Reebok…)": ["Hoka Clifton 9", "Hoka Bondi 8", "Reebok Classic"],
}
PRECOS      = ["até R$150", "até R$300", "até R$600", "acima R$1000"]
FAIXAS      = ["Até 19", "20–29", "30–39", "40–49", "50+"]
SEXOS       = ["Masculino", "Feminino", "Outros"]
COMENTARIOS_PRODUTO = [
    "Produto de ótima qualidade", "Achei o preço justo",
    "Boa variedade de tamanhos", "Gostei muito do acabamento",
    "Produto melhor do que esperava", "Excelente custo-benefício",
    "", "", "", ""  # maioria sem comentário
]
COMENTARIOS_AVALIACAO = [
    "Atendimento excelente!", "Muito bem atendido",
    "Vendedor muito prestativo", "Ótima experiência de compra",
    "Poderia ter mais variedade de modelos",
    "Atendimento rápido e eficiente",
    "Voltarei com certeza", "Recomendo a loja",
    "", "", "", "", ""
]
COMENTARIOS_VENDEDOR = [
    "Muito atencioso", "Conhece bem os produtos",
    "Explicou bem as diferenças entre os modelos",
    "Ótimo atendimento", "Super prestativo",
    "Top demais!", "", "", "", "", ""
]

# Distribuição de notas realista (maioria alta)
NOTAS_PESOS = [1]*1 + [2]*2 + [3]*5 + [4]*12 + [5]*20

def ts_aleatorio():
    """Gera timestamp entre hoje e 30 dias atrás, em horário comercial."""
    base = datetime.now() - timedelta(days=random.randint(0, 30))
    hora = random.randint(9, 20)
    mins = random.randint(0, 59)
    secs = random.randint(0, 59)
    dt = base.replace(hour=hora, minute=mins, second=secs, microsecond=0)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.000Z")

def montar_payload(i):
    marca = random.choice(MARCAS)
    modelo = random.choice(MODELOS.get(marca, [""]))
    nota = random.choice(NOTAS_PESOS)
    vendedor = random.choice(VENDEDORES)
    faixa_etaria = random.choice(FAIXAS)
    sexo = random.choice(SEXOS)
    preco = random.choice(PRECOS)
    cm1 = random.choice(COMENTARIOS_PRODUTO)
    cm3 = random.choice(COMENTARIOS_AVALIACAO)
    cm4 = random.choice(COMENTARIOS_VENDEDOR)

    contato = ""
    if nota <= 2 and random.random() > 0.4:
        contato = random.choice([
            "86" + str(random.randint(90000000, 99999999)),
            f"cliente{i}@email.com"
        ])

    # Monta estrutura Firestore
    fields = {
        "timestamp":    {"stringValue": ts_aleatorio()},
        "marcas":       {"stringValue": marca},
        "modelos":      {"stringValue": modelo},
        "faixa_preco":  {"stringValue": preco},
        "faixa_etaria": {"stringValue": faixa_etaria},
        "sexo":         {"stringValue": sexo},
        "nota":         {"integerValue": str(nota)},
        "vendedor":     {"stringValue": vendedor},
        "contato":      {"stringValue": contato},
        "cm1":          {"stringValue": cm1},
        "cm2":          {"stringValue": ""},
        "cm3":          {"stringValue": cm3},
        "cm4":          {"stringValue": cm4},
        "produtos": {
            "arrayValue": {
                "values": [{
                    "mapValue": {
                        "fields": {
                            "marca":  {"stringValue": marca},
                            "modelo": {"stringValue": modelo}
                        }
                    }
                }]
            }
        }
    }
    return {"fields": fields}

def main():
    print("\n" + "="*55)
    print("  🎽 WT Satisfação PDV — Inserir dados de teste")
    print("="*55 + "\n")

    total = 40
    ok = 0
    erros = 0

    for i in range(1, total + 1):
        payload = montar_payload(i)
        resp = requests.post(URL, json=payload)
        if resp.status_code == 200:
            ok += 1
            print(f"  ✅ [{i:02d}/{total}] {payload['fields']['marcas']['stringValue']:25s} "
                  f"nota {payload['fields']['nota']['integerValue']} "
                  f"— {payload['fields']['vendedor']['stringValue']}")
        else:
            erros += 1
            print(f"  ❌ [{i:02d}/{total}] Erro {resp.status_code}: {resp.text[:80]}")

    print(f"\n{'='*55}")
    print(f"  ✅ {ok} inseridos com sucesso | ❌ {erros} erros")
    print(f"  Agora vá ao Apps Script e execute: sincronizar")
    print(f"{'='*55}\n")

if __name__ == "__main__":
    main()
