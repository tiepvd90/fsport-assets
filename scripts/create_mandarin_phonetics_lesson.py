from __future__ import annotations

from pathlib import Path
import shutil

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_AUTO_SHAPE_TYPE, MSO_CONNECTOR
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.oxml.xmlchemy import OxmlElement
from pptx.util import Inches, Pt


OUT_DIR = Path(r"D:\DEMO")
ASSET_DIR = OUT_DIR / "assets_ngu_am_tieng_trung"
SOURCE_COVER = Path(r"C:\Users\PC\.codex\generated_images\01a14ead-c56a-7f53-af1e-fbc762d70f97\exec-6dde3c8a-ea4b-4246-9381-608e7284d0f6.png")
SOURCE_MOUTH = Path(r"C:\Users\PC\.codex\generated_images\01a14ead-c56a-7f53-af1e-fbc762d70f97\exec-3f88a86c-5630-406a-b83c-e489dca30421.png")

W = Inches(13.333)
H = Inches(7.5)

NAVY = RGBColor(18, 48, 74)
JADE = RGBColor(20, 137, 120)
JADE_DARK = RGBColor(11, 104, 91)
CORAL = RGBColor(236, 99, 82)
GOLD = RGBColor(240, 180, 61)
SKY = RGBColor(88, 181, 222)
CREAM = RGBColor(250, 247, 239)
WHITE = RGBColor(255, 255, 255)
INK = RGBColor(35, 46, 56)
MUTED = RGBColor(91, 105, 116)
PALE_JADE = RGBColor(226, 244, 239)
PALE_CORAL = RGBColor(253, 233, 228)
PALE_SKY = RGBColor(230, 244, 251)
LIGHT = RGBColor(238, 241, 242)

FONT = "Arial"
CJK_FONT = "Microsoft YaHei"


def style_run(run, font, size, bold, color):
    """Use Arial for Vietnamese/Pinyin and an explicit East-Asian font for Hanzi."""
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


def add_rect(slide, x, y, w, h, fill, radius=False, line=None, transparency=0):
    shape_type = MSO_AUTO_SHAPE_TYPE.ROUNDED_RECTANGLE if radius else MSO_AUTO_SHAPE_TYPE.RECTANGLE
    shape = slide.shapes.add_shape(shape_type, x, y, w, h)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.fill.transparency = transparency
    shape.line.color.rgb = line if line else fill
    if radius:
        shape.adjustments[0] = 0.12
    return shape


def add_text(slide, text, x, y, w, h, size=20, color=INK, bold=False,
             align=PP_ALIGN.LEFT, valign=MSO_ANCHOR.TOP, font=FONT,
             margin=0.05, line_spacing=1.0):
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    for idx, line in enumerate(text.split("\n")):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = line
        p.alignment = align
        p.line_spacing = line_spacing
        p.space_after = Pt(0)
        for run in p.runs:
            style_run(run, font, size, bold, color)
    return box


def add_rich_text(slide, runs, x, y, w, h, size=18, color=INK,
                  valign=MSO_ANCHOR.TOP, margin=0.07):
    box = slide.shapes.add_textbox(x, y, w, h)
    tf = box.text_frame
    tf.clear()
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    tf.vertical_anchor = valign
    p = tf.paragraphs[0]
    p.space_after = Pt(0)
    for item in runs:
        r = p.add_run()
        r.text = item.get("text", "")
        style_run(
            r,
            item.get("font", FONT),
            item.get("size", size),
            item.get("bold", False),
            item.get("color", color),
        )
    return box


def add_title(slide, number, title_cn, title_vi, accent=JADE):
    add_rect(slide, 0, 0, W, Inches(0.13), accent)
    add_text(slide, f"{number:02d}", Inches(0.48), Inches(0.33), Inches(0.52), Inches(0.38),
             12, WHITE, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    badge = slide.shapes[-1]
    badge.fill.solid(); badge.fill.fore_color.rgb = accent
    badge.line.color.rgb = accent
    add_text(slide, title_cn, Inches(1.15), Inches(0.28), Inches(4.4), Inches(0.48), 26, NAVY, True)
    add_text(slide, title_vi, Inches(1.17), Inches(0.76), Inches(7.2), Inches(0.30), 11, MUTED, False)
    add_text(slide, "汉语语音 · NGỮ ÂM TIẾNG TRUNG", Inches(9.0), Inches(0.42), Inches(3.8), Inches(0.32),
             10, accent, True, PP_ALIGN.RIGHT)


def add_footer(slide, page):
    add_text(slide, "Giáo án song ngữ Việt–Trung • Trình độ nhập môn", Inches(0.55), Inches(7.12),
             Inches(7.0), Inches(0.20), 8, MUTED)
    add_text(slide, str(page), Inches(12.15), Inches(7.10), Inches(0.55), Inches(0.22), 9, MUTED, True, PP_ALIGN.RIGHT)


def add_picture_cover(slide, path, x, y, w, h):
    with Image.open(path) as im:
        iw, ih = im.size
    frame_ratio = w / h
    image_ratio = iw / ih
    if image_ratio > frame_ratio:
        crop = (1 - frame_ratio / image_ratio) / 2
        pic = slide.shapes.add_picture(str(path), x, y, w, h)
        pic.crop_left = crop
        pic.crop_right = crop
    else:
        crop = (1 - image_ratio / frame_ratio) / 2
        pic = slide.shapes.add_picture(str(path), x, y, w, h)
        pic.crop_top = crop
        pic.crop_bottom = crop
    return pic


def add_pill(slide, text, x, y, w, fill, color=WHITE, size=12):
    add_rect(slide, x, y, w, Inches(0.36), fill, radius=True)
    add_text(slide, text, x, y + Inches(0.01), w, Inches(0.31), size, color, True,
             PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE, margin=0)


def add_tone_curve(slide, x, y, w, h, tone, color):
    if tone == 1:
        pts = [(0.05, 0.18), (0.95, 0.18)]
    elif tone == 2:
        pts = [(0.08, 0.82), (0.95, 0.12)]
    elif tone == 3:
        pts = [(0.06, 0.35), (0.42, 0.83), (0.95, 0.18)]
    elif tone == 4:
        pts = [(0.08, 0.12), (0.95, 0.85)]
    else:
        pts = [(0.38, 0.55), (0.62, 0.55)]
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        line = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT,
                                          x + int(w * x1), y + int(h * y1),
                                          x + int(w * x2), y + int(h * y2))
        line.line.color.rgb = color
        line.line.width = Pt(3.5)


def target_path():
    base = OUT_DIR / "Giao_an_Ngu_am_Tieng_Trung_song_ngu.pptx"
    if not base.exists():
        return base
    i = 2
    while True:
        candidate = OUT_DIR / f"Giao_an_Ngu_am_Tieng_Trung_song_ngu_v{i}.pptx"
        if not candidate.exists():
            return candidate
        i += 1


def build():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    cover_path = ASSET_DIR / "anh_bia_luyen_phat_am.png"
    mouth_path = ASSET_DIR / "minh_hoa_khau_hinh.png"
    shutil.copy2(SOURCE_COVER, cover_path)
    shutil.copy2(SOURCE_MOUTH, mouth_path)

    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]

    # Slide 1 — cover
    slide = prs.slides.add_slide(blank)
    add_picture_cover(slide, cover_path, 0, 0, W, H)
    add_rect(slide, 0, 0, Inches(7.25), H, WHITE, transparency=8)
    add_rect(slide, 0, 0, Inches(7.25), Inches(0.14), JADE)
    add_pill(slide, "GIÁO ÁN 45 PHÚT • 入门课", Inches(0.72), Inches(0.72), Inches(2.65), JADE)
    add_text(slide, "汉语语音", Inches(0.68), Inches(1.45), Inches(5.7), Inches(0.85), 42, NAVY, True)
    add_text(slide, "NGỮ ÂM TIẾNG TRUNG", Inches(0.72), Inches(2.30), Inches(5.8), Inches(0.58), 25, CORAL, True)
    add_text(slide, "Thanh mẫu • Vận mẫu • Thanh điệu\n声母 · 韵母 · 声调", Inches(0.74), Inches(3.13), Inches(5.15), Inches(0.98),
             18, INK, False, line_spacing=1.15)
    add_rect(slide, Inches(0.73), Inches(4.40), Inches(5.38), Inches(1.26), CREAM, radius=True, line=LIGHT)
    add_text(slide, "Kết quả: đọc đúng cấu trúc âm tiết Pinyin, phân biệt 4 thanh điệu và sửa các lỗi khẩu hình thường gặp.",
             Inches(1.02), Inches(4.67), Inches(4.82), Inches(0.76), 15, INK, False, valign=MSO_ANCHOR.MIDDLE)
    add_text(slide, "汉语拼音 HÀNYǓ PĪNYĪN", Inches(0.74), Inches(6.62), Inches(4.0), Inches(0.32), 11, JADE_DARK, True)

    # Slide 2 — objectives and flow
    slide = prs.slides.add_slide(blank)
    add_title(slide, 2, "学习目标与课堂流程", "MỤC TIÊU VÀ TIẾN TRÌNH TIẾT HỌC", JADE)
    objectives = [
        ("01", "识别 / Nhận diện", "21 thanh mẫu, nhóm vận mẫu và cấu trúc âm tiết Pinyin."),
        ("02", "发音 / Phát âm", "Đặt môi – lưỡi đúng với các cặp âm dễ nhầm."),
        ("03", "声调 / Thanh điệu", "Đọc 4 thanh + thanh nhẹ trong từ và câu ngắn."),
    ]
    y = 1.35
    for num, head, body in objectives:
        add_rect(slide, Inches(0.58), Inches(y), Inches(5.25), Inches(1.12), WHITE, radius=True, line=LIGHT)
        add_text(slide, num, Inches(0.78), Inches(y + 0.25), Inches(0.60), Inches(0.42), 15, WHITE, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        badge = slide.shapes[-1]; badge.fill.solid(); badge.fill.fore_color.rgb = JADE; badge.line.color.rgb = JADE
        add_text(slide, head, Inches(1.62), Inches(y + 0.16), Inches(3.85), Inches(0.34), 16, NAVY, True)
        add_text(slide, body, Inches(1.62), Inches(y + 0.53), Inches(3.90), Inches(0.42), 11.5, MUTED)
        y += 1.32
    add_rect(slide, Inches(6.18), Inches(1.35), Inches(6.55), Inches(4.44), PALE_SKY, radius=True, line=PALE_SKY)
    add_text(slide, "课堂流程 · TIẾN TRÌNH 45’", Inches(6.55), Inches(1.63), Inches(5.7), Inches(0.38), 18, NAVY, True)
    stages = [
        ("5’", "热身", "Khởi động: nghe & bắt chước"),
        ("10’", "声母", "Thanh mẫu + khẩu hình"),
        ("10’", "韵母", "Vận mẫu + ghép âm"),
        ("10’", "声调", "Thanh điệu + biến điệu"),
        ("8’", "练习", "Luyện cặp âm & từ"),
        ("2’", "出口卡", "Phiếu thoát cuối giờ"),
    ]
    for i, (minute, cn, vi) in enumerate(stages):
        yy = 2.26 + i * 0.53
        add_text(slide, minute, Inches(6.58), Inches(yy), Inches(0.55), Inches(0.28), 11, CORAL, True, PP_ALIGN.RIGHT)
        add_rect(slide, Inches(7.28), Inches(yy + 0.08), Inches(0.18), Inches(0.18), JADE if i < 4 else GOLD, radius=True)
        add_text(slide, cn, Inches(7.70), Inches(yy - 0.02), Inches(0.85), Inches(0.30), 12, NAVY, True)
        add_text(slide, vi, Inches(8.62), Inches(yy - 0.02), Inches(3.45), Inches(0.30), 11, INK)
    add_rect(slide, Inches(6.18), Inches(6.05), Inches(6.55), Inches(0.72), PALE_CORAL, radius=True, line=PALE_CORAL)
    add_text(slide, "教学法 / Phương pháp: nghe → quan sát khẩu hình → bắt chước → đối chiếu → tự sửa",
             Inches(6.48), Inches(6.22), Inches(5.95), Inches(0.34), 11.5, CORAL, True, valign=MSO_ANCHOR.MIDDLE)
    add_footer(slide, 2)

    # Slide 3 — initials
    slide = prs.slides.add_slide(blank)
    add_title(slide, 3, "声母：发音部位", "THANH MẪU: VỊ TRÍ CẤU ÂM", CORAL)
    add_picture_cover(slide, mouth_path, Inches(0.55), Inches(1.28), Inches(5.18), Inches(4.75))
    add_pill(slide, "看口型 · QUAN SÁT KHẨU HÌNH", Inches(0.82), Inches(5.64), Inches(2.75), NAVY, size=10.5)
    groups = [
        ("双唇音 / âm môi", "b  p  m  f", "Giữ môi ổn định; p bật hơi, b không bật hơi.", PALE_CORAL, CORAL),
        ("舌尖音 / đầu lưỡi", "d  t  n  l  |  z  c  s", "Đầu lưỡi chạm/lướt vùng sau răng trên.", PALE_SKY, SKY),
        ("舌根音 / gốc lưỡi", "g  k  h", "Gốc lưỡi nâng; k bật hơi rõ.", PALE_JADE, JADE),
        ("舌面音 / mặt lưỡi", "j  q  x", "Mặt lưỡi trước nâng; đi với i, ü.", CREAM, GOLD),
        ("翘舌音 / uốn lưỡi", "zh  ch  sh  r", "Đầu lưỡi cong nhẹ; tránh đọc giống z c s.", PALE_CORAL, CORAL),
    ]
    for i, (head, sounds, note, fill, accent) in enumerate(groups):
        yy = 1.28 + i * 1.03
        add_rect(slide, Inches(6.05), Inches(yy), Inches(6.67), Inches(0.86), fill, radius=True, line=fill)
        add_text(slide, head, Inches(6.32), Inches(yy + 0.10), Inches(2.20), Inches(0.28), 11.5, accent, True)
        add_text(slide, sounds, Inches(8.45), Inches(yy + 0.07), Inches(3.90), Inches(0.32), 17, NAVY, True)
        add_text(slide, note, Inches(6.32), Inches(yy + 0.45), Inches(5.95), Inches(0.27), 10, INK)
    add_rect(slide, Inches(6.05), Inches(6.48), Inches(6.67), Inches(0.42), NAVY, radius=True)
    add_text(slide, "对比练习 / Luyện đối chiếu:  zǎo—zhǎo  •  cā—chā  •  sū—shū  •  qù—chù",
             Inches(6.25), Inches(6.55), Inches(6.28), Inches(0.25), 10.5, WHITE, True, PP_ALIGN.CENTER)
    add_footer(slide, 3)

    # Slide 4 — finals and syllable structure
    slide = prs.slides.add_slide(blank)
    add_title(slide, 4, "韵母与音节结构", "VẬN MẪU VÀ CẤU TRÚC ÂM TIẾT", SKY)
    add_rect(slide, Inches(0.58), Inches(1.30), Inches(12.15), Inches(1.08), NAVY, radius=True)
    add_text(slide, "声母  +  韵母  +  声调   →   音节", Inches(0.85), Inches(1.50), Inches(7.05), Inches(0.43), 23, WHITE, True, PP_ALIGN.CENTER)
    add_text(slide, "thanh mẫu + vận mẫu + thanh điệu → âm tiết", Inches(7.78), Inches(1.58), Inches(4.40), Inches(0.30), 12, PALE_SKY, False, PP_ALIGN.CENTER)
    cards = [
        ("单韵母", "Vận mẫu đơn", "a  o  e  i  u  ü", "Mở miệng rõ, giữ âm ổn định.", PALE_CORAL, CORAL),
        ("复韵母", "Vận mẫu kép", "ai  ei  ao  ou\nia  ie  ua  uo  üe", "Chuyển khẩu hình liền mạch.", PALE_JADE, JADE),
        ("鼻韵母", "Vận mẫu mũi", "an  en  ang  eng  ong\nin  ing  ian  iong", "-n: đầu lưỡi; -ng: gốc lưỡi.", PALE_SKY, SKY),
    ]
    for i, (cn, vi, items, note, fill, accent) in enumerate(cards):
        xx = 0.58 + i * 4.17
        add_rect(slide, Inches(xx), Inches(2.75), Inches(3.83), Inches(2.57), fill, radius=True, line=fill)
        add_text(slide, cn, Inches(xx + 0.28), Inches(3.03), Inches(1.55), Inches(0.35), 18, NAVY, True)
        add_text(slide, vi, Inches(xx + 1.72), Inches(3.08), Inches(1.75), Inches(0.25), 10, accent, True, PP_ALIGN.RIGHT)
        add_text(slide, items, Inches(xx + 0.30), Inches(3.65), Inches(3.20), Inches(0.72), 17, INK, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        add_text(slide, note, Inches(xx + 0.32), Inches(4.66), Inches(3.18), Inches(0.42), 10.5, MUTED, False, PP_ALIGN.CENTER)
    add_rect(slide, Inches(0.58), Inches(5.68), Inches(12.15), Inches(1.03), CREAM, radius=True, line=LIGHT)
    add_text(slide, "拼读 / GHÉP ÂM", Inches(0.89), Inches(5.98), Inches(1.55), Inches(0.33), 14, CORAL, True)
    add_text(slide, "m + a + ˉ = mā 妈 (mẹ)     |     h + ao + ˇ = hǎo 好 (tốt)     |     x + üe + ´ = xué 学 (học)",
             Inches(2.45), Inches(5.89), Inches(9.78), Inches(0.48), 16, NAVY, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
    add_footer(slide, 4)

    # Slide 5 — tones
    slide = prs.slides.add_slide(blank)
    add_title(slide, 5, "四声与轻声", "BỐN THANH ĐIỆU VÀ THANH NHẸ", GOLD)
    tone_data = [
        (1, "第一声  阴平", "mā  妈", "cao – ngang", JADE),
        (2, "第二声  阳平", "má  麻", "đi lên", SKY),
        (3, "第三声  上声", "mǎ  马", "hạ rồi lên", GOLD),
        (4, "第四声  去声", "mà  骂", "rơi mạnh", CORAL),
        (5, "轻声", "ma  吗", "nhẹ, ngắn", MUTED),
    ]
    for i, (tone, label, example, desc, accent) in enumerate(tone_data):
        yy = 1.31 + i * 1.02
        add_rect(slide, Inches(0.60), Inches(yy), Inches(8.25), Inches(0.82), WHITE, radius=True, line=LIGHT)
        add_text(slide, str(tone) if tone < 5 else "·", Inches(0.82), Inches(yy + 0.16), Inches(0.44), Inches(0.42),
                 17, WHITE, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        badge = slide.shapes[-1]; badge.fill.solid(); badge.fill.fore_color.rgb = accent; badge.line.color.rgb = accent
        add_text(slide, label, Inches(1.48), Inches(yy + 0.14), Inches(1.75), Inches(0.30), 12, NAVY, True)
        add_tone_curve(slide, Inches(3.35), Inches(yy + 0.08), Inches(1.25), Inches(0.58), tone, accent)
        add_text(slide, example, Inches(4.88), Inches(yy + 0.13), Inches(1.72), Inches(0.38), 19, accent, True, PP_ALIGN.CENTER)
        add_text(slide, desc, Inches(6.78), Inches(yy + 0.19), Inches(1.60), Inches(0.27), 11, MUTED, False, PP_ALIGN.CENTER)
    add_rect(slide, Inches(9.17), Inches(1.31), Inches(3.55), Inches(3.14), PALE_JADE, radius=True, line=PALE_JADE)
    add_text(slide, "声调位置\nVỊ TRÍ DẤU THANH", Inches(9.53), Inches(1.62), Inches(2.82), Inches(0.68), 16, NAVY, True, PP_ALIGN.CENTER)
    add_text(slide, "① Có a → đặt trên a\n② Không a: ưu tiên o / e\n③ iu, ui → đặt trên chữ sau\n\n例: hǎo · xiè · liú · guǐ",
             Inches(9.55), Inches(2.54), Inches(2.78), Inches(1.42), 12.5, INK, False, PP_ALIGN.LEFT, line_spacing=1.12)
    add_rect(slide, Inches(9.17), Inches(4.78), Inches(3.55), Inches(1.64), PALE_CORAL, radius=True, line=PALE_CORAL)
    add_text(slide, "变调 / BIẾN ĐIỆU", Inches(9.48), Inches(5.03), Inches(2.92), Inches(0.32), 14, CORAL, True, PP_ALIGN.CENTER)
    add_text(slide, "nǐ hǎo → ní hǎo\nbù shì → bú shì", Inches(9.54), Inches(5.51), Inches(2.80), Inches(0.60), 17, NAVY, True, PP_ALIGN.CENTER)
    add_footer(slide, 5)

    # Slide 6 — rules and errors
    slide = prs.slides.add_slide(blank)
    add_title(slide, 6, "拼写规则与常见错误", "QUY TẮC GHI ÂM VÀ LỖI THƯỜNG GẶP", CORAL)
    add_text(slide, "三条关键规则 · 3 QUY TẮC CỐT LÕI", Inches(0.62), Inches(1.29), Inches(5.55), Inches(0.38), 17, NAVY, True)
    rules = [
        ("1", "j / q / x + ü", "Bỏ hai chấm: ju, qu, xu\nnhưng nü, lü vẫn giữ ü."),
        ("2", "零声母 / không thanh mẫu", "i → y: yi, ye, yao\nu → w: wu, wo, wai\nü → yu: yu, yue, yun"),
        ("3", "i đặc biệt", "zhi, chi, shi, ri, zi, ci, si:\n‘i’ không đọc như i trong mi."),
    ]
    for i, (num, head, body) in enumerate(rules):
        yy = 1.83 + i * 1.45
        add_rect(slide, Inches(0.60), Inches(yy), Inches(5.72), Inches(1.16), CREAM if i == 1 else WHITE, radius=True, line=LIGHT)
        add_text(slide, num, Inches(0.84), Inches(yy + 0.29), Inches(0.50), Inches(0.50), 18, WHITE, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE)
        badge = slide.shapes[-1]; badge.fill.solid(); badge.fill.fore_color.rgb = [CORAL, SKY, JADE][i]; badge.line.color.rgb = [CORAL, SKY, JADE][i]
        add_text(slide, head, Inches(1.57), Inches(yy + 0.15), Inches(2.10), Inches(0.33), 14, NAVY, True)
        add_text(slide, body, Inches(3.62), Inches(yy + 0.12), Inches(2.40), Inches(0.84), 10.5, INK, False, valign=MSO_ANCHOR.MIDDLE)
    add_text(slide, "诊断与纠正 · CHẨN ĐOÁN VÀ SỬA LỖI", Inches(6.72), Inches(1.29), Inches(5.90), Inches(0.38), 17, NAVY, True)
    errors = [
        ("z / zh", "Không cong ↔ cong nhẹ đầu lưỡi", "zǎo  ↔  zhǎo"),
        ("q / ch", "q: mặt lưỡi; ch: uốn lưỡi", "qù  ↔  chù"),
        ("-n / -ng", "-n: đầu lưỡi; -ng: gốc lưỡi", "fēn  ↔  fēng"),
        ("2 / 3", "Thanh 2 đi lên; thanh 3 hạ thấp", "má  ↔  mǎ"),
    ]
    for i, (pair, cue, ex) in enumerate(errors):
        yy = 1.83 + i * 1.10
        add_rect(slide, Inches(6.70), Inches(yy), Inches(5.98), Inches(0.84), PALE_CORAL if i % 2 == 0 else PALE_SKY, radius=True, line=PALE_CORAL if i % 2 == 0 else PALE_SKY)
        add_text(slide, pair, Inches(6.96), Inches(yy + 0.18), Inches(0.92), Inches(0.30), 14, CORAL if i % 2 == 0 else SKY, True, PP_ALIGN.CENTER)
        add_text(slide, cue, Inches(8.08), Inches(yy + 0.12), Inches(2.73), Inches(0.48), 10.5, INK, False, valign=MSO_ANCHOR.MIDDLE)
        add_text(slide, ex, Inches(10.92), Inches(yy + 0.18), Inches(1.45), Inches(0.30), 13, NAVY, True, PP_ALIGN.CENTER)
    add_rect(slide, Inches(6.70), Inches(6.34), Inches(5.98), Inches(0.48), NAVY, radius=True)
    add_text(slide, "纠音口诀: 慢一点 · 夸张一点 · 录音对比 / Chậm – rõ – ghi âm – đối chiếu",
             Inches(6.91), Inches(6.42), Inches(5.56), Inches(0.25), 10, WHITE, True, PP_ALIGN.CENTER)
    add_footer(slide, 6)

    # Slide 7 — practice and exit ticket
    slide = prs.slides.add_slide(blank)
    add_title(slide, 7, "综合练习与出口卡", "LUYỆN TẬP TỔNG HỢP VÀ PHIẾU THOÁT", JADE)
    add_rect(slide, Inches(0.58), Inches(1.27), Inches(8.20), Inches(5.57), WHITE, radius=True, line=LIGHT)
    add_text(slide, "练习 A · ĐỌC THEO NHÓM", Inches(0.90), Inches(1.61), Inches(3.05), Inches(0.33), 15, JADE_DARK, True)
    add_text(slide, "mā 妈  ·  má 麻  ·  mǎ 马  ·  mà 骂", Inches(1.12), Inches(2.11), Inches(6.95), Inches(0.47), 23, NAVY, True, PP_ALIGN.CENTER)
    add_text(slide, "练习 B · PHÂN BIỆT CẶP ÂM", Inches(0.90), Inches(2.86), Inches(3.35), Inches(0.33), 15, CORAL, True)
    add_text(slide, "zǎo — zhǎo    |    qù — chù    |    fēn — fēng    |    má — mǎ",
             Inches(1.02), Inches(3.36), Inches(7.23), Inches(0.46), 15.5, INK, True, PP_ALIGN.CENTER)
    add_text(slide, "练习 C · ĐỌC CÂU", Inches(0.90), Inches(4.15), Inches(2.75), Inches(0.33), 15, SKY, True)
    add_text(slide, "你好！Nǐ hǎo!  →  Ní hǎo!\n我学习汉语。Wǒ xuéxí Hànyǔ.\n这不是书。Zhè bú shì shū.",
             Inches(1.12), Inches(4.65), Inches(6.90), Inches(1.38), 18, NAVY, True, PP_ALIGN.CENTER, MSO_ANCHOR.MIDDLE, line_spacing=1.08)
    add_rect(slide, Inches(9.15), Inches(1.27), Inches(3.58), Inches(3.08), PALE_JADE, radius=True, line=PALE_JADE)
    add_text(slide, "出口卡 · EXIT TICKET", Inches(9.48), Inches(1.62), Inches(2.92), Inches(0.34), 15, JADE_DARK, True, PP_ALIGN.CENTER)
    add_text(slide, "1. Đọc một cặp âm khó.\n\n2. Đọc mā–má–mǎ–mà.\n\n3. Nêu một quy tắc Pinyin.",
             Inches(9.56), Inches(2.18), Inches(2.72), Inches(1.66), 12.5, INK, False)
    add_rect(slide, Inches(9.15), Inches(4.66), Inches(3.58), Inches(2.18), NAVY, radius=True)
    add_text(slide, "教师提示 / GỢI Ý GV", Inches(9.50), Inches(4.98), Inches(2.88), Inches(0.33), 14, GOLD, True, PP_ALIGN.CENTER)
    add_text(slide, "• Cho HS ghi âm 15 giây.\n• Phản hồi: 1 đúng + 1 cần sửa.\n• Ôn lại bằng 3 từ cá nhân.",
             Inches(9.52), Inches(5.48), Inches(2.76), Inches(0.95), 10, WHITE, False)
    add_text(slide, "谢谢！CẢM ƠN", Inches(0.76), Inches(6.97), Inches(3.0), Inches(0.24), 9, JADE_DARK, True)
    add_footer(slide, 7)

    # Core properties and save
    prs.core_properties.title = "Giáo án Ngữ âm tiếng Trung song ngữ Việt–Trung"
    prs.core_properties.subject = "Thanh mẫu, vận mẫu, thanh điệu và luyện phát âm Pinyin"
    prs.core_properties.author = "OpenAI Codex"
    prs.core_properties.keywords = "tiếng Trung, ngữ âm, Pinyin, song ngữ, giáo án"
    output = OUT_DIR / "Giao_an_Ngu_am_Tieng_Trung_song_ngu_font_Arial.pptx"
    prs.save(output)
    print(output)
    print(f"slides={len(prs.slides)}")
    print(f"size={output.stat().st_size}")


if __name__ == "__main__":
    build()
