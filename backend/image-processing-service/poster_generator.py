from PIL import Image, ImageDraw, ImageFont
import os
import time
import textwrap


# =====================================
# Output Folder
# =====================================

OUTPUT_FOLDER = "generated"

if not os.path.exists(OUTPUT_FOLDER):
    os.makedirs(OUTPUT_FOLDER)


# =====================================
# Poster Themes
# =====================================

THEMES = [

    {
        "name": "corporate",
        "background": "#0F172A",
        "primary": "#2563EB",
        "card": "#FFFFFF",
        "text": "#111827"
    },

    {
        "name": "modern",
        "background": "#111827",
        "primary": "#7C3AED",
        "card": "#FFFFFF",
        "text": "#111827"
    },

    {
        "name": "startup",
        "background": "#1C1917",
        "primary": "#EA580C",
        "card": "#FFFFFF",
        "text": "#111827"
    },

    {
        "name": "linkedin",
        "background": "#0A66C2",
        "primary": "#FFFFFF",
        "card": "#F8FAFC",
        "text": "#111827"
    },

    {
        "name": "social",
        "background": "#831843",
        "primary": "#EC4899",
        "card": "#FFFFFF",
        "text": "#111827"
    }

]


# =====================================
# Font Loader
# =====================================

def get_font(size):

    fonts = [

        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial.ttf"

    ]

    for font in fonts:

        try:

            return ImageFont.truetype(font, size)

        except:

            pass

    return ImageFont.load_default()


# =====================================
# Auto Resize Font
# =====================================

def fit_text(text, max_width, start_size):

    size = start_size

    while size >= 28:

        font = get_font(size)

        left, top, right, bottom = font.getbbox(text)

        width = right - left

        if width <= max_width:

            return font

        size -= 2

    return get_font(28)


# =====================================
# Wrap Long Job Title
# =====================================

def wrap_title(text):

    if not text:
        return [""]

    return textwrap.wrap(
        text,
        width=22
    )[:2]


# =====================================
# Draw Center Text
# =====================================

def draw_center(draw, text, font, y, color, width):

    left, top, right, bottom = font.getbbox(text)

    text_width = right - left

    x = (width - text_width) // 2

    draw.text(
        (x, y),
        text,
        fill=color,
        font=font
    )


# =====================================
# Generate Posters
# =====================================

def generate_posters(job):

    posters = []

    timestamp = int(time.time())

    for theme in THEMES:

        width = 1080
        height = 1350

        image = Image.new(
            "RGB",
            (width, height),
            theme["background"]
        )

        draw = ImageDraw.Draw(image)        # =====================================
        # Top Decoration
        # =====================================

        draw.rectangle(
            (0, 0, width, 18),
            fill=theme["primary"]
        )

        draw.ellipse(
            (-120, -120, 250, 250),
            fill=theme["primary"]
        )

        draw.ellipse(
            (850, -80, 1200, 270),
            fill=theme["primary"]
        )

        # =====================================
        # Header
        # =====================================

        header_font = get_font(68)

        draw_center(
            draw,
            "WE ARE HIRING",
            header_font,
            90,
            "white",
            width
        )

        # =====================================
        # Decorative Line
        # =====================================

        draw.rounded_rectangle(
            (180, 190, 900, 198),
            radius=10,
            fill=theme["primary"]
        )

        # =====================================
        # Job Title
        # =====================================

        title = job.get("title", "")

        title_font = fit_text(
            title,
            850,
            72
        )

        y = 260

        for line in wrap_title(title):

            draw_center(
                draw,
                line,
                title_font,
                y,
                "white",
                width
            )

            y += 78

        # =====================================
        # Information Card
        # =====================================

        draw.rounded_rectangle(
            (80, 470, 1000, 980),
            radius=40,
            fill=theme["card"]
        )

        info_title = get_font(36)
        info_font = get_font(42)

        text_color = theme["text"]        # =====================================
        # Company
        # =====================================

        draw.text(
            (130, 540),
            "COMPANY",
            fill=theme["primary"],
            font=info_title
        )

        draw.text(
            (130, 590),
            job.get("company", ""),
            fill=text_color,
            font=info_font
        )

        # =====================================
        # Company Logo
        # =====================================

        logo_path = job.get("companyLogo", "")
        if logo_path:
            abs_logo_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), logo_path.lstrip('/'))
            try:
                logo_img = Image.open(abs_logo_path).convert("RGBA")
                logo_img.thumbnail((200, 200), Image.Resampling.LANCZOS)
                
                logo_x = 950 - logo_img.width
                logo_y = 540
                
                image.paste(logo_img, (logo_x, logo_y), logo_img)
            except Exception as e:
                print(f"Failed to load logo: {e}")

        # =====================================
        # Location
        # =====================================

        draw.text(
            (130, 680),
            "LOCATION",
            fill=theme["primary"],
            font=info_title
        )

        draw.text(
            (130, 730),
            job.get("location", ""),
            fill=text_color,
            font=info_font
        )

        # =====================================
        # Experience
        # =====================================

        draw.text(
            (130, 820),
            "EXPERIENCE",
            fill=theme["primary"],
            font=info_title
        )

        draw.text(
            (130, 870),
            job.get("experience", ""),
            fill=text_color,
            font=info_font
        )

        # =====================================
        # Employment Type
        # =====================================

        draw.text(
            (580, 820),
            "JOB TYPE",
            fill=theme["primary"],
            font=info_title
        )

        draw.text(
            (580, 870),
            job.get("employmentType", ""),
            fill=text_color,
            font=info_font
        )

        # =====================================
        # Apply Button
        # =====================================

        draw.rounded_rectangle(
            (250, 1060, 830, 1170),
            radius=60,
            fill=theme["primary"]
        )

        button_font = get_font(52)

        draw_center(
            draw,
            "APPLY NOW",
            button_font,
            1090,
            "white",
            width
        )        # =====================================
        # Footer
        # =====================================

        footer_font = get_font(28)

        draw_center(
            draw,
            job.get("company", ""),
            footer_font,
            1260,
            "#D1D5DB",
            width
        )

        # =====================================
        # Save Poster
        # =====================================

        filename = f"{theme['name']}_{timestamp}.png"

        filepath = os.path.join(
            OUTPUT_FOLDER,
            filename
        )

        image.save(filepath)

        posters.append(filepath)

    return posters