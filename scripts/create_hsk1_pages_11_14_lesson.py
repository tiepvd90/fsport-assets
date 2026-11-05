from __future__ import annotations

from pathlib import Path

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_CONNECTOR
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Inches, Pt


ROOT = Path(r"D:\DEMO\Giao_an_HSK1_3.0_Trang_11-14")
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "Giao_an_HSK1_3.0_Bai_1_Trang_11-14.pptx"

W, H = Inches(13.333), Inches(7.5)

NAVY = RGBColor(24, 48, 67)
CORAL = RGBColor(232, 91, 82)
CORAL_DARK = RGBColor(191, 64, 59)
SALMON = RGBColor(247, 174, 153)
CREAM = RGBColor(253, 248, 240)
PALE_CORAL = RGBColor(254, 234, 226)
JADE = RGBColor(28, 138, 121)
PALE_JADE = RGBColor(226, 244, 239)
SKY = RGBColor(83, 174, 215)
PALE_SKY = RGBColor(230, 244, 251)
GOLD = RGBColor(235, 177, 61)
INK = RGBColor(38, 48, 55)
MUTED = RGBColor(92, 104, 112)
LIGHT = RGBColor(229, 233, 234)
WHITE = RGBColor(255, 255, 255)
FONT = "Arial"
CJK_FONT = "Microsoft YaHei"


def style_run(run, size, bold, color, font=FONT):
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    rpr = run._r.get_or_add_rPr()
    for tag, typeface in (("a:ea", CJK_FONT), ("a:cs", font)):
        node = rpr.find(qn(tag))
        if node is None:
            node = OxmlElement(tag)
            rpr.append(node)
        node.set("typeface", typeface)


def rect(slide, x, y, w, h, fill, radius=False, line=None, transparency=0):
    kind = MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE if radius else MSO_AUTO_SHAPE_TYPE.RECTANGLE
    s = slide.shapes.add_shape(kind, x, y, w, h)
    s.fill.solid(); s.fill.fore_color.rgb = fill; s.fill.transparency = transparency
    s.line.color.rgb = line or fill
    if radius:
        s.adjustments[0] = 0.12
    return s


def text(slide, value, x, y, w, h, size=18, color=INK, bold=False,
         align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, margin=0.04,
         spacing=1.0):
    b = slide.shapes.add_textbox(x, y, w, h)
    tf = b.text_frame; tf.clear(); tf.word_wrap = True
    tf.margin_left = Inches(margin); tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin); tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    for i, line in enumerate(value.split("\n")):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.text = line; p.alignment = align; p.line_spacing = spacing; p.space_after = Pt(0)
        for r in p.runs:
            style_run(r, size, bold, color)
    return b


def title(slide, n, cn, vi, accent=CORAL):
    rect(slide, 0, 0, W, Inches(0.12), accent)
    badge = rect(slide, Inches(0.46), Inches(0.31), Inches(0.56), Inches(0.44), accent, radius=True)
    text(slide, f"{n:02}", Inches(0.46), Inches(0.34), Inches(0.56), Inches(0.32), 12, WHITE, True,
         PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE, 0)
    text(slide, cn, Inches(1.18), Inches(0.27), Inches(5.5), Inches(0.47), 25, NAVY, True)
    text(slide, vi, Inches(1.20), Inches(0.73), Inches(6.7), Inches(0.28), 10.5, MUTED)
    text(slide, "HSK 1 (3.0) · BÀI 1", Inches(10.0), Inches(0.40), Inches(2.75), Inches(0.28),
         10, accent, True, PP_ALIGN.RIGHT)


def footer(slide, n):
    text(slide, "Nguồn nội dung: OK-SBT HSK1 (3.0), trang PDF 11–14", Inches(0.52), Inches(7.13),
         Inches(7.8), Inches(0.18), 7.5, MUTED)
    text(slide, str(n), Inches(12.25), Inches(7.10), Inches(0.45), Inches(0.20), 8, MUTED, True, PP_ALIGN.RIGHT)


def image_cover(slide, path, x, y, w, h):
    with Image.open(path) as im:
        iw, ih = im.size
    frame_ratio = w / h; image_ratio = iw / ih
    pic = slide.shapes.add_picture(str(path), x, y, w, h)
    if image_ratio > frame_ratio:
        crop = (1 - frame_ratio / image_ratio) / 2
        pic.crop_left = crop; pic.crop_right = crop
    else:
        crop = (1 - image_ratio / frame_ratio) / 2
        pic.crop_top = crop; pic.crop_bottom = crop
    return pic


def pill(slide, value, x, y, w, fill, color=WHITE, size=11):
    rect(slide, x, y, w, Inches(0.35), fill, radius=True)
    text(slide, value, x, y + Inches(0.01), w, Inches(0.28), size, color, True,
         PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE, 0)


def vocab_card(slide, img_name, hanzi, pinyin, vi, x, y, w, h, accent=CORAL):
    rect(slide, x, y, w, h, WHITE, radius=True, line=LIGHT)
    image_cover(slide, ASSETS / img_name, x + Inches(0.05), y + Inches(0.05), w - Inches(0.10), h - Inches(0.75))
    rect(slide, x + Inches(0.04), y + h - Inches(0.73), w - Inches(0.08), Inches(0.69), CREAM, radius=True, line=CREAM)
    text(slide, hanzi, x + Inches(0.10), y + h - Inches(0.67), Inches(0.65), Inches(0.40), 18, NAVY, True,
         PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    text(slide, pinyin, x + Inches(0.80), y + h - Inches(0.64), w - Inches(1.02), Inches(0.22), 11, accent, True,
         PP_ALIGN.LEFT, MSO_ANCHOR.MIDDLE)
    text(slide, vi, x + Inches(0.80), y + h - Inches(0.38), w - Inches(1.02), Inches(0.18), 8.5, MUTED)


def tone_line(slide, x, y, w, h, tone, color):
    pts = {
        1: [(0.06, .15), (.94, .15)],
        2: [(0.08, .76), (.94, .12)],
        3: [(0.06, .42), (.42, .82), (.94, .18)],
        4: [(0.08, .12), (.94, .82)],
    }[tone]
    for (a, b), (c, d) in zip(pts, pts[1:]):
        line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x + int(w*a), y + int(h*b), x + int(w*c), y + int(h*d))
        line.line.color.rgb = color; line.line.width = Pt(4)


def build():
    prs = Presentation(); prs.slide_width = W; prs.slide_height = H
    blank = prs.slide_layouts[6]

    # 1 — cover
    s = prs.slides.add_slide(blank)
    rect(s, 0, 0, W, H, CREAM)
    rect(s, 0, 0, Inches(7.2), H, CORAL)
    rect(s, Inches(0.65), Inches(0.68), Inches(1.2), Inches(0.42), WHITE, radius=True)
    text(s, "第一课 · BÀI 1", Inches(0.65), Inches(0.73), Inches(1.2), Inches(0.27), 11, CORAL, True, PP_ALIGN.CENTER)
    text(s, "AI小语，你好！", Inches(0.67), Inches(1.45), Inches(5.9), Inches(0.82), 35, WHITE, True)
    text(s, "Xin chào AI Tiểu Ngữ!", Inches(0.70), Inches(2.35), Inches(5.65), Inches(0.50), 24, WHITE, True)
    text(s, "语音 · NGỮ ÂM", Inches(0.72), Inches(3.14), Inches(3.8), Inches(0.39), 17, GOLD, True)
    text(s, "Âm tiết tiếng Trung · Thanh mẫu & vận mẫu\nBốn thanh điệu · Nghe, đọc và luyện tập",
         Inches(0.72), Inches(3.68), Inches(5.65), Inches(1.02), 15, WHITE, False, spacing=1.18)
    rect(s, Inches(0.72), Inches(5.14), Inches(5.48), Inches(1.05), RGBColor(204, 67, 63), radius=True)
    text(s, "Tài liệu: OK-SBT HSK1 (3.0)\nPhạm vi: trang PDF 11–14 · Tiết học 45 phút",
         Inches(1.02), Inches(5.37), Inches(4.85), Inches(0.58), 12, WHITE, False, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    image_cover(s, ASSETS / "06_xuesheng_student.png", Inches(7.48), Inches(0.54), Inches(2.52), Inches(3.04))
    image_cover(s, ASSETS / "07_laoshi_teachers.png", Inches(10.10), Inches(0.54), Inches(2.58), Inches(3.04))
    image_cover(s, ASSETS / "01_cha_tea.png", Inches(7.48), Inches(3.74), Inches(2.52), Inches(2.98))
    image_cover(s, ASSETS / "21_duihua_nihao.png", Inches(10.10), Inches(3.74), Inches(2.58), Inches(2.98))
    footer(s, 1)

    # 2 — objectives
    s = prs.slides.add_slide(blank); title(s, 2, "学习目标与教学流程", "MỤC TIÊU VÀ TIẾN TRÌNH DẠY HỌC", CORAL)
    goals = [
        ("01", "音节 / Âm tiết", "Phân tích thanh mẫu + vận mẫu + thanh điệu."),
        ("02", "拼读 / Ghép âm", "Đọc nhóm thanh mẫu, vận mẫu và quy tắc kết hợp."),
        ("03", "声调 / Thanh điệu", "Nhận diện đường nét 55–35–214–51."),
        ("04", "交际 / Giao tiếp", "Dùng 你好、你们好、谢谢、不客气."),
    ]
    for i, (num, head, body) in enumerate(goals):
        y = 1.31 + i * 1.18
        rect(s, Inches(0.58), Inches(y), Inches(5.65), Inches(0.95), WHITE, radius=True, line=LIGHT)
        rect(s, Inches(0.78), Inches(y+0.18), Inches(0.55), Inches(0.55), [CORAL, SKY, JADE, GOLD][i], radius=True)
        text(s, num, Inches(0.78), Inches(y+0.27), Inches(0.55), Inches(0.28), 11, WHITE, True, PP_ALIGN.CENTER)
        text(s, head, Inches(1.55), Inches(y+0.13), Inches(2.10), Inches(0.30), 14, NAVY, True)
        text(s, body, Inches(3.55), Inches(y+0.12), Inches(2.35), Inches(0.58), 10, INK, False, valign=MSO_ANCHOR.MIDDLE)
    rect(s, Inches(6.52), Inches(1.31), Inches(6.18), Inches(4.93), PALE_CORAL, radius=True, line=PALE_CORAL)
    text(s, "课堂流程 · 45 PHÚT", Inches(6.92), Inches(1.65), Inches(5.35), Inches(0.36), 18, NAVY, True)
    flow = [("5’", "热身", "Chào hỏi + nghe mẫu"), ("10’", "音节", "Cấu trúc âm tiết"),
            ("10’", "声韵母", "Thanh mẫu & vận mẫu"), ("10’", "声调", "Bốn thanh điệu"),
            ("8’", "听读练", "Luyện nghe – đọc"), ("2’", "出口卡", "Phiếu thoát")]
    for i, (m, cn, vi) in enumerate(flow):
        y = 2.27 + i * 0.57
        text(s, m, Inches(6.88), Inches(y), Inches(0.55), Inches(0.28), 11, CORAL_DARK, True, PP_ALIGN.RIGHT)
        rect(s, Inches(7.63), Inches(y+0.07), Inches(0.17), Inches(0.17), CORAL if i < 4 else GOLD, radius=True)
        text(s, cn, Inches(8.02), Inches(y-0.02), Inches(0.92), Inches(0.30), 12, NAVY, True)
        text(s, vi, Inches(9.02), Inches(y-0.02), Inches(2.85), Inches(0.30), 10.5, INK)
    rect(s, Inches(6.52), Inches(6.48), Inches(6.18), Inches(0.40), NAVY, radius=True)
    text(s, "教学法 / Phương pháp: nghe → nhìn → nhắc lại → ghép âm → giao tiếp",
         Inches(6.75), Inches(6.55), Inches(5.72), Inches(0.22), 9.5, WHITE, True, PP_ALIGN.CENTER)
    footer(s, 2)

    # 3 — syllable structure
    s = prs.slides.add_slide(blank); title(s, 3, "汉语音节", "ÂM TIẾT TIẾNG TRUNG", SKY)
    labels = [("声母", "Thanh mẫu", CORAL), ("韵母", "Vận mẫu", JADE), ("声调", "Thanh điệu", GOLD)]
    for i, (cn, vi, col) in enumerate(labels):
        x = 0.75 + i * 2.55
        rect(s, Inches(x), Inches(1.35), Inches(2.14), Inches(1.12), col, radius=True)
        text(s, cn, Inches(x), Inches(1.52), Inches(2.14), Inches(0.36), 20, WHITE, True, PP_ALIGN.CENTER)
        text(s, vi, Inches(x), Inches(1.96), Inches(2.14), Inches(0.24), 10, WHITE, False, PP_ALIGN.CENTER)
        if i < 2:
            text(s, "+", Inches(x+2.20), Inches(1.63), Inches(0.30), Inches(0.35), 22, NAVY, True, PP_ALIGN.CENTER)
    text(s, "→", Inches(8.35), Inches(1.63), Inches(0.45), Inches(0.35), 24, NAVY, True, PP_ALIGN.CENTER)
    rect(s, Inches(8.92), Inches(1.35), Inches(3.35), Inches(1.12), NAVY, radius=True)
    text(s, "音节 · Âm tiết", Inches(8.92), Inches(1.69), Inches(3.35), Inches(0.36), 20, WHITE, True, PP_ALIGN.CENTER)
    rect(s, Inches(0.72), Inches(2.82), Inches(11.85), Inches(2.46), WHITE, radius=True, line=LIGHT)
    heads = ["声母\nThanh mẫu", "韵母\nVận mẫu", "声调\nThanh điệu", "音节\nÂm tiết", "汉字\nChữ Hán"]
    xs = [0.85, 3.00, 5.17, 7.34, 9.51]
    for x, htxt in zip(xs, heads):
        rect(s, Inches(x), Inches(3.03), Inches(1.90), Inches(0.54), PALE_CORAL, radius=True, line=PALE_CORAL)
        text(s, htxt, Inches(x), Inches(3.10), Inches(1.90), Inches(0.40), 10.5, CORAL_DARK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    rows = [("b", "a", "¯", "bā", "八"), ("b", "a", "´", "bá", "拔"),
            ("b", "a", "ˇ", "bǎ", "把"), ("b", "a", "`", "bà", "爸")]
    for r, values in enumerate(rows):
        y = 3.72 + r * 0.35
        for x, value in zip(xs, values):
            text(s, value, Inches(x), Inches(y), Inches(1.90), Inches(0.26), 14, NAVY if r < 3 else CORAL_DARK,
                 True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    rect(s, Inches(0.72), Inches(5.64), Inches(11.85), Inches(1.04), CREAM, radius=True, line=LIGHT)
    text(s, "提示 / GHI NHỚ", Inches(0.99), Inches(5.93), Inches(1.52), Inches(0.30), 13, CORAL_DARK, True)
    text(s, "Mỗi chữ Hán thường tương ứng một âm tiết. Có âm tiết không có thanh mẫu: ā 阿 · á 啊.",
         Inches(2.55), Inches(5.85), Inches(9.45), Inches(0.45), 15, NAVY, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    footer(s, 3)

    # 4 — vocab set 1
    s = prs.slides.add_slide(blank); title(s, 4, "看图读音节（一）", "NHÌN TRANH – ĐỌC ÂM TIẾT (1)", CORAL)
    items = [
        ("01_cha_tea.png", "茶", "chá", "trà"), ("02_gou_dog.png", "狗", "gǒu", "chó"),
        ("03_mao_cat.png", "猫", "māo", "mèo"), ("04_cai_vegetables.png", "菜", "cài", "rau"),
        ("05_beizi_cup.png", "杯子", "bēizi", "cốc"), ("06_xuesheng_student.png", "学生", "xuésheng", "học sinh"),
        ("07_laoshi_teachers.png", "老师", "lǎoshī", "giáo viên"), ("08_jidan_eggs.png", "鸡蛋", "jīdàn", "trứng gà"),
    ]
    for i, item in enumerate(items):
        col, row = i % 4, i // 4
        vocab_card(s, *item, Inches(0.55 + col * 3.16), Inches(1.23 + row * 2.79), Inches(2.82), Inches(2.52), CORAL)
    pill(s, "先听 → 跟读 → 遮住拼音再读 / Nghe → nhắc lại → che Pinyin và đọc", Inches(2.52), Inches(6.70), Inches(8.25), NAVY, size=10)
    footer(s, 4)

    # 5 — initials/finals
    s = prs.slides.add_slide(blank); title(s, 5, "声母和韵母（1）", "THANH MẪU VÀ VẬN MẪU (1)", JADE)
    rect(s, Inches(0.58), Inches(1.28), Inches(4.15), Inches(4.72), PALE_CORAL, radius=True, line=PALE_CORAL)
    text(s, "声母 · THANH MẪU", Inches(0.94), Inches(1.62), Inches(3.42), Inches(0.36), 17, CORAL_DARK, True, PP_ALIGN.CENTER)
    for i, line in enumerate(["b   p   m   f", "d   t   n   l", "g   k   h"]):
        rect(s, Inches(0.95), Inches(2.28 + i * 0.88), Inches(3.40), Inches(0.60), WHITE, radius=True, line=WHITE)
        text(s, line, Inches(0.95), Inches(2.42 + i * 0.88), Inches(3.40), Inches(0.30), 20, NAVY, True, PP_ALIGN.CENTER)
    text(s, "听一听：b/p · d/t · g/k\nNghe độ bật hơi của từng cặp.", Inches(0.98), Inches(5.05), Inches(3.34), Inches(0.58), 11, INK, False, PP_ALIGN.CENTER)
    rect(s, Inches(4.98), Inches(1.28), Inches(4.10), Inches(4.72), PALE_JADE, radius=True, line=PALE_JADE)
    text(s, "韵母 · VẬN MẪU", Inches(5.35), Inches(1.62), Inches(3.36), Inches(0.36), 17, JADE, True, PP_ALIGN.CENTER)
    finals = ["a   o   e   i   u   ü   er", "ai        ei   ao   ou", "an        en", "ang      eng   ong"]
    for i, line in enumerate(finals):
        rect(s, Inches(5.33), Inches(2.20 + i * 0.70), Inches(3.40), Inches(0.50), WHITE, radius=True, line=WHITE)
        text(s, line, Inches(5.33), Inches(2.30 + i * 0.70), Inches(3.40), Inches(0.27), 15, NAVY, True, PP_ALIGN.CENTER)
    rect(s, Inches(9.33), Inches(1.28), Inches(3.38), Inches(5.57), CREAM, radius=True, line=LIGHT)
    text(s, "拼合规则\nQUY TẮC KẾT HỢP", Inches(9.65), Inches(1.61), Inches(2.72), Inches(0.68), 16, NAVY, True, PP_ALIGN.CENTER)
    rules = [
        "① Trong nhóm này, chỉ n/l ghép với ü.",
        "② b, p, f không ghép với e.",
        "③ f, g, k, h không ghép với i.",
        "④ er đứng độc lập, không ghép thanh mẫu.",
    ]
    text(s, "\n\n".join(rules), Inches(9.62), Inches(2.62), Inches(2.79), Inches(2.85), 11.5, INK, False)
    rect(s, Inches(9.62), Inches(5.80), Inches(2.79), Inches(0.62), NAVY, radius=True)
    text(s, "判断 / Phán đoán:\n*ber  *fi  nǚ  lǜ", Inches(9.68), Inches(5.91), Inches(2.67), Inches(0.38), 10.5, WHITE, True, PP_ALIGN.CENTER)
    footer(s, 5)

    # 6 — tones
    s = prs.slides.add_slide(blank); title(s, 6, "四声", "BỐN THANH ĐIỆU", GOLD)
    rect(s, Inches(0.55), Inches(1.22), Inches(7.70), Inches(3.46), WHITE, radius=True, line=LIGHT)
    for level in range(5, 0, -1):
        y = 1.68 + (5-level) * 0.52
        text(s, str(level), Inches(0.78), Inches(y-0.09), Inches(0.28), Inches(0.22), 9, MUTED, True, PP_ALIGN.CENTER)
        line = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, Inches(1.15), Inches(y), Inches(7.82), Inches(y))
        line.line.color.rgb = LIGHT; line.line.width = Pt(1)
    tone_info = [(1, "一声 55", JADE, 1.30), (2, "二声 35", SKY, 3.10), (3, "三声 214", GOLD, 4.90), (4, "四声 51", CORAL, 6.68)]
    for tone, label, col, x in tone_info:
        text(s, label, Inches(x), Inches(1.37), Inches(1.42), Inches(0.26), 11, col, True, PP_ALIGN.CENTER)
        tone_line(s, Inches(x), Inches(1.76), Inches(1.42), Inches(2.36), tone, col)
    rect(s, Inches(8.55), Inches(1.22), Inches(4.18), Inches(3.46), PALE_SKY, radius=True, line=PALE_SKY)
    text(s, "声调标在主要元音上\nDấu thanh đặt trên nguyên âm chính", Inches(8.90), Inches(1.55), Inches(3.45), Inches(0.70), 15, NAVY, True, PP_ALIGN.CENTER)
    drills = ["ā   á   ǎ   à", "ē   é   ě   è", "ér   ěr   èr", "dā   dá   dǎ   dà", "kē   ké   kě   kè"]
    for i, d in enumerate(drills):
        text(s, d, Inches(8.95), Inches(2.48 + i * 0.39), Inches(3.35), Inches(0.25), 14, [JADE, SKY, GOLD, CORAL, NAVY][i], True, PP_ALIGN.CENTER)
    rect(s, Inches(0.55), Inches(5.02), Inches(12.18), Inches(1.66), CREAM, radius=True, line=LIGHT)
    text(s, "跟读练习 · LUYỆN ĐỌC", Inches(0.90), Inches(5.34), Inches(2.12), Inches(0.32), 15, CORAL_DARK, True)
    text(s, "mō  mó  mǒ  mò     |     fū  fú  fǔ  fù     |     dī  dí  dǐ  dì     |     tāo  táo  tǎo  tào",
         Inches(2.90), Inches(5.26), Inches(9.25), Inches(0.40), 17, NAVY, True, PP_ALIGN.CENTER)
    text(s, "GV đọc theo nhịp tay; HS vẽ đường thanh điệu trong không khí.", Inches(2.90), Inches(5.89), Inches(9.25), Inches(0.28), 10.5, MUTED, False, PP_ALIGN.CENTER)
    footer(s, 6)

    # 7 — vocab set 2A
    s = prs.slides.add_slide(blank); title(s, 7, "看图读音节（二）", "NHÌN TRANH – ĐỌC ÂM TIẾT (2)", SKY)
    items = [
        ("09_kou_mouth.png", "口", "kǒu", "miệng"), ("10_fan_rice.png", "饭", "fàn", "cơm / bữa ăn"),
        ("11_he_drink.png", "喝", "hē", "uống"), ("12_er_two.png", "二", "èr", "hai"),
        ("13_nihao_greeting.png", "你好", "nǐ hǎo", "xin chào"), ("14_pengyou_friends.png", "朋友", "péngyou", "bạn bè"),
    ]
    for i, item in enumerate(items):
        col, row = i % 3, i // 3
        vocab_card(s, *item, Inches(0.60 + col * 4.18), Inches(1.24 + row * 2.76), Inches(3.78), Inches(2.48), SKY)
    footer(s, 7)

    # 8 — vocab set 2B
    s = prs.slides.add_slide(blank); title(s, 8, "看图读音节（三）", "NHÌN TRANH – ĐỌC ÂM TIẾT (3)", JADE)
    items = [
        ("15_mianbao_bread.png", "面包", "miànbāo", "bánh mì"), ("16_meimei_sisters.png", "妹妹", "mèimei", "em gái"),
        ("17_fangjian_room.png", "房间", "fángjiān", "phòng"), ("18_baitian_daytime.png", "白天", "báitiān", "ban ngày"),
        ("19_fandian_restaurant.png", "饭店", "fàndiàn", "nhà hàng"), ("20_diannao_computer.png", "电脑", "diànnǎo", "máy tính"),
    ]
    for i, item in enumerate(items):
        col, row = i % 3, i // 3
        vocab_card(s, *item, Inches(0.60 + col * 4.18), Inches(1.24 + row * 2.76), Inches(3.78), Inches(2.48), JADE)
    footer(s, 8)

    # 9 — listening practice
    s = prs.slides.add_slide(blank); title(s, 9, "听、读与练习", "NGHE, ĐỌC VÀ LUYỆN TẬP", CORAL)
    exercises = [
        ("1", "听声调 / Nghe thanh điệu", "GV đọc: mō / mó / mǒ / mò\nHS giơ 1–2–3–4 và đọc lại.", PALE_CORAL, CORAL),
        ("2", "写声母 / Viết thanh mẫu", "___ à   ___ ěi   ___ án\n___ eng  ___ ó    ___ ào", PALE_SKY, SKY),
        ("3", "写韵母 / Viết vận mẫu", "t ___   h ___   m ___\nd ___   g ___   p ___", PALE_JADE, JADE),
        ("4", "标声调 / Ghi thanh điệu", "lao · neng · ge · ba\nfen · kan · bai · li", CREAM, GOLD),
    ]
    for i, (num, head, body, fill, accent) in enumerate(exercises):
        col, row = i % 2, i // 2
        x, y = 0.62 + col * 6.22, 1.30 + row * 2.45
        rect(s, Inches(x), Inches(y), Inches(5.85), Inches(2.05), fill, radius=True, line=fill)
        rect(s, Inches(x+0.27), Inches(y+0.27), Inches(0.55), Inches(0.55), accent, radius=True)
        text(s, num, Inches(x+0.27), Inches(y+0.38), Inches(0.55), Inches(0.25), 12, WHITE, True, PP_ALIGN.CENTER)
        text(s, head, Inches(x+1.02), Inches(y+0.27), Inches(4.35), Inches(0.34), 15, NAVY, True)
        text(s, body, Inches(x+1.02), Inches(y+0.82), Inches(4.32), Inches(0.84), 13, INK, False, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE, spacing=1.15)
    rect(s, Inches(0.62), Inches(6.36), Inches(12.07), Inches(0.48), NAVY, radius=True)
    text(s, "操作 / Cách tổ chức: lần 1 chỉ nghe · lần 2 viết · lần 3 đối chiếu theo cặp · lần 4 đọc to",
         Inches(0.82), Inches(6.45), Inches(11.67), Inches(0.24), 10.5, WHITE, True, PP_ALIGN.CENTER)
    footer(s, 9)

    # 10 — dialogue matching
    s = prs.slides.add_slide(blank); title(s, 10, "看图选对话", "NHÌN TRANH – CHỌN HỘI THOẠI", JADE)
    scenes = [
        ("21_duihua_nihao.png", "A", "Nǐ hǎo!  你好！\nNǐ hǎo!  你好！"),
        ("22_duihua_nimenhao.png", "B", "Nǐ hǎo!  你好！\nNǐmen hǎo!  你们好！"),
        ("23_duihua_xiexie.png", "C", "Xièxie!  谢谢！\nBú kèqi!  不客气！"),
    ]
    for i, (img, lab, dlg) in enumerate(scenes):
        x = 0.58 + i * 4.22
        rect(s, Inches(x), Inches(1.25), Inches(3.86), Inches(4.67), WHITE, radius=True, line=LIGHT)
        image_cover(s, ASSETS / img, Inches(x+0.07), Inches(1.32), Inches(3.72), Inches(2.52))
        pill(s, lab, Inches(x+0.20), Inches(3.58), Inches(0.48), [CORAL, SKY, JADE][i], size=13)
        text(s, dlg, Inches(x+0.38), Inches(4.12), Inches(3.10), Inches(0.92), 14, NAVY, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE, spacing=1.15)
        text(s, ["Hai người chào nhau", "Một người chào một nhóm", "Cảm ơn – đáp lời"][i],
             Inches(x+0.38), Inches(5.34), Inches(3.10), Inches(0.30), 10, MUTED, False, PP_ALIGN.CENTER)
    rect(s, Inches(0.58), Inches(6.18), Inches(12.52), Inches(0.64), PALE_CORAL, radius=True, line=PALE_CORAL)
    text(s, "答案 / ĐÁP ÁN:  Ảnh 1 → A     Ảnh 2 → B     Ảnh 3 → C     •     出口卡: nói 1 lời chào + 1 lời cảm ơn",
         Inches(0.85), Inches(6.34), Inches(11.96), Inches(0.28), 11.5, CORAL_DARK, True, PP_ALIGN.CENTER)
    footer(s, 10)

    prs.core_properties.title = "Giáo án HSK1 (3.0) Bài 1 – trang 11 đến 14"
    prs.core_properties.subject = "Âm tiết, thanh mẫu, vận mẫu, thanh điệu và luyện tập"
    prs.core_properties.author = "OpenAI Codex"
    prs.core_properties.keywords = "HSK1, giáo án, song ngữ, ngữ âm, Pinyin"
    prs.save(OUTPUT)
    print(OUTPUT)
    print(f"slides={len(prs.slides)} size={OUTPUT.stat().st_size}")


if __name__ == "__main__":
    build()
