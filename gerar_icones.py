"""
============================================================
  WT Satisfação PDV — gerar_icones.py
  Versão: 2.0 | Agosto 2026

  O QUE FAZ:
  - Gera os ícones do app (PWA) na pasta /icons
  - Usa a marca FB (img/logo-fb.png) como ícone
  - O logo original vem com fundo preto chapado; o script remove
    esse preto pelo brilho e compõe a marca sobre o fundo do app

  COMO USAR:
      python gerar_icones.py
============================================================
"""

import os
from PIL import Image, ImageEnhance

# Fundo do icone: preto (mesmo do logo original). Para usar o azul do
# dashboard, troque por (26, 40, 72).
FUNDO = (10, 10, 12)

BASE = os.path.dirname(os.path.abspath(__file__))
LOGO = os.path.join(BASE, "img", "logo-fb.png")
PASTA = os.path.join(BASE, "icons")


def marca_recortada():
    """Abre o logo FB e transforma o preto do fundo em transparencia."""
    img = Image.open(LOGO).convert("RGBA")

    # o fundo e preto puro e a marca e clara -> o brilho vira o alpha
    alpha = img.convert("L")
    alpha = ImageEnhance.Contrast(alpha).enhance(1.35)

    marca = img.copy()
    marca.putalpha(alpha)

    # clareia um pouco para a marca nao sumir em telas pequenas
    rgb = ImageEnhance.Brightness(marca.convert("RGB")).enhance(1.30)
    marca = rgb.convert("RGBA")
    marca.putalpha(alpha)

    return marca.crop(marca.getbbox())


def desenhar(tamanho, escala_conteudo, arredondar):
    S = 1024  # desenha grande e reduz no final (antialias)
    img = Image.new("RGBA", (S, S), FUNDO + (255,))

    marca = marca_recortada()
    alvo = S * escala_conteudo
    fator = min(alvo / marca.width, alvo / marca.height)
    marca = marca.resize(
        (max(1, int(marca.width * fator)), max(1, int(marca.height * fator))),
        Image.LANCZOS,
    )

    img.alpha_composite(marca, ((S - marca.width) // 2, (S - marca.height) // 2))

    if arredondar:
        from PIL import ImageDraw

        mascara = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mascara).rounded_rectangle(
            [0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255
        )
        img.putalpha(mascara)

    return img.resize((tamanho, tamanho), Image.LANCZOS)


def main():
    os.makedirs(PASTA, exist_ok=True)

    saidas = [
        # (arquivo, tamanho, escala do conteudo, cantos arredondados)
        ("icon-192.png", 192, 0.66, True),
        ("icon-512.png", 512, 0.66, True),
        ("icon-maskable-512.png", 512, 0.50, False),   # margem p/ mascara do Android
        ("apple-touch-icon-180.png", 180, 0.66, False),  # iOS ja arredonda sozinho
        ("favicon-32.png", 32, 0.78, False),
    ]

    for arquivo, tam, escala, arred in saidas:
        img = desenhar(tam, escala, arred)
        img.save(os.path.join(PASTA, arquivo), "PNG")
        print(f"  ok  icons/{arquivo}  ({tam}x{tam})")

    print("\nIcones gerados em:", PASTA)


if __name__ == "__main__":
    main()
