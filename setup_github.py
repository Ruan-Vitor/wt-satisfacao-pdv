"""
============================================================
  WT Satisfação PDV — setup_github.py
  Versão: 1.0 | Maio 2026

  O QUE FAZ:
  - Inicializa o repositório Git na pasta atual
  - Cria o .gitignore adequado
  - Adiciona todos os arquivos do projeto
  - Faz o primeiro commit
  - Conecta ao repositório remoto do GitHub
  - Faz o push inicial

  COMO USAR:
  No terminal do VSCode (Ctrl+J), dentro da pasta do projeto:
      python setup_github.py
============================================================
"""

import subprocess
import sys
import os

def run(cmd, capture=False):
    """Executa um comando e mostra o resultado."""
    print(f"  › {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=capture, text=True)
    if result.returncode != 0 and not capture:
        print(f"\n❌ Erro ao executar: {cmd}")
        if result.stderr:
            print(result.stderr)
    return result

def main():
    print("\n" + "="*55)
    print("  🎽 WT Satisfação PDV — Setup do GitHub")
    print("="*55 + "\n")

    # Verificar se Git está instalado
    check = subprocess.run("git --version", shell=True, capture_output=True)
    if check.returncode != 0:
        print("❌ Git não encontrado!")
        print("   Instale em: https://git-scm.com/download/win")
        print("   Após instalar, feche e reabra o VSCode e tente novamente.\n")
        sys.exit(1)

    print("✅ Git encontrado.\n")

    # Pasta atual
    pasta = os.getcwd()
    print(f"📁 Pasta do projeto: {pasta}\n")

    # Criar .gitignore
    gitignore = """# Arquivos do sistema
.DS_Store
Thumbs.db
desktop.ini

# VSCode
.vscode/
*.code-workspace

# Python
__pycache__/
*.py[cod]
*.pyo
.env
venv/
env/

# Credenciais (NUNCA suba para o GitHub)
*.key
*.pem
secrets.json
"""
    with open(".gitignore", "w", encoding="utf-8") as f:
        f.write(gitignore)
    print("✅ .gitignore criado.\n")

    # Verificar se já é um repositório git
    is_git = subprocess.run("git status", shell=True, capture_output=True)
    if is_git.returncode != 0:
        print("📦 Inicializando repositório Git...")
        run("git init")
        run('git branch -M main')
    else:
        print("✅ Repositório Git já existe.\n")

    # Adicionar e commitar
    print("\n📝 Adicionando arquivos...")
    run("git add .")
    run('git commit -m "Primeiro commit — WT Satisfacao PDV v3.0"')

    # URL do repositório
    print("\n" + "-"*55)
    print("📋 Cole aqui a URL do seu repositório no GitHub.")
    print("   Exemplo: https://github.com/Ruan-Vitor/wt-satisfacao-pdv.git")
    print("-"*55)
    url = input("\nURL do repositório: ").strip()

    if not url:
        print("❌ URL não informada. Execute o script novamente.")
        sys.exit(1)

    # Verificar se já tem remote
    remote_check = subprocess.run("git remote get-url origin", shell=True, capture_output=True)
    if remote_check.returncode == 0:
        print("\n🔄 Remote 'origin' já existe — atualizando URL...")
        run(f"git remote set-url origin {url}")
    else:
        run(f"git remote add origin {url}")

    # Push
    print("\n🚀 Enviando para o GitHub...")
    result = run("git push -u origin main")

    if result and result.returncode != 0:
        # Tentar com force caso haja conflito de histórico
        print("\n⚠️  Tentando push com --force (branch nova)...")
        run("git push -u origin main --force")

    print("\n" + "="*55)
    print("✅ Projeto enviado para o GitHub com sucesso!")
    print(f"\n🔗 Acesse: {url.replace('.git', '')}")
    print("\nPróximo passo: abra o GUIA_COMPLETO.md — Etapa 4")
    print("="*55 + "\n")

if __name__ == "__main__":
    main()
