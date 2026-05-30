"""
============================================================
  WT Satisfação PDV — push.py
  Versão: 1.0 | Maio 2026

  O QUE FAZ:
  - Adiciona todas as alterações feitas no projeto
  - Faz commit com a mensagem que você passar
  - Envia para o GitHub
  - O Vercel detecta a mudança e atualiza o site em ~30s

  COMO USAR:
  No terminal do VSCode (Ctrl+J):
      python push.py "Descrição do que mudou"

  EXEMPLOS:
      python push.py "Atualiza lista de vendedores"
      python push.py "Corrige texto da tela 2"
      python push.py "Adiciona nova marca"
============================================================
"""

import subprocess
import sys
import os
from datetime import datetime

def run(cmd):
    print(f"  › {cmd}")
    result = subprocess.run(cmd, shell=True, text=True)
    return result

def main():
    # Mensagem de commit
    if len(sys.argv) > 1:
        mensagem = " ".join(sys.argv[1:])
    else:
        data = datetime.now().strftime("%d/%m/%Y %H:%M")
        mensagem = f"Atualização — {data}"

    print("\n" + "="*50)
    print(f"  🚀 Enviando para o GitHub")
    print(f"  📝 Mensagem: {mensagem}")
    print("="*50 + "\n")

    # Verificar se há alterações
    status = subprocess.run("git status --porcelain", shell=True, capture_output=True, text=True)
    if not status.stdout.strip():
        print("✅ Nenhuma alteração encontrada. O site já está atualizado.\n")
        sys.exit(0)

    # Mostrar o que mudou
    print("📄 Arquivos alterados:")
    for linha in status.stdout.strip().split("\n"):
        print(f"   {linha}")
    print()

    # Add, commit, push
    run("git add .")
    run(f'git commit -m "{mensagem}"')
    result = run("git push")

    if result.returncode == 0:
        print("\n" + "="*50)
        print("✅ Enviado com sucesso!")
        print("⏱  O Vercel vai atualizar o site em ~30 segundos.")
        print("="*50 + "\n")
    else:
        print("\n❌ Erro no push. Verifique sua conexão ou as credenciais do GitHub.\n")

if __name__ == "__main__":
    main()
