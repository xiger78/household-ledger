#!/usr/bin/env python3
"""Generate README screenshot mockups for Korean and Japanese UI."""

from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "screenshots"

W, H = 390, 844
PRIMARY = "#4F46E5"
EXPENSE = "#EF4444"
INCOME = "#10B981"
BG = "#F8FAFC"
CARD = "#FFFFFF"
TEXT = "#1E293B"
TEXT_SEC = "#64748B"
BORDER = "#E2E8F0"
WORK_BG = "#DBEAFE"
WORK_TX = "#1D4ED8"
REST_BG = "#FEE2E2"
REST_TX = "#DC2626"


def hex_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/Library/Fonts/Arial Unicode.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for path in candidates:
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def rounded_rect(draw, xy, radius, fill):
    x0, y0, x1, y1 = xy
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def draw_header(draw, fonts, title: str, subtitle: str):
    draw.rectangle((0, 0, W, 88), fill=hex_rgb(PRIMARY))
    draw.text((20, 18), title, fill=(255, 255, 255), font=fonts["title"])
    draw.text((20, 48), subtitle, fill=(230, 230, 255), font=fonts["sub"])


def draw_month_selector(draw, fonts, label: str):
    y = 96
    rounded_rect(draw, (16, y, W - 16, y + 44), 10, hex_rgb(CARD))
    draw.text((W // 2 - 60, y + 12), f"◀  {label}  ▶", fill=hex_rgb(TEXT), font=fonts["body"])


def draw_tabs(draw, fonts, tabs: list[tuple[str, str]], active: int):
    y = H - 72
    draw.rectangle((0, y, W, H), fill=hex_rgb(CARD))
    draw.line((0, y, W, y), fill=hex_rgb(BORDER), width=1)
    col = W // len(tabs)
    for i, (icon, label) in enumerate(tabs):
        cx = col * i + col // 2
        color = hex_rgb(PRIMARY) if i == active else hex_rgb(TEXT_SEC)
        draw.text((cx - 8, y + 8), icon, fill=color, font=fonts["icon"])
        draw.text((cx - 24, y + 34), label, fill=color, font=fonts["tiny"])


def draw_card(draw, fonts, y: int, title: str, body_fn, height: int = 0) -> int:
    h = height or 120
    rounded_rect(draw, (16, y, W - 16, y + h), 12, hex_rgb(CARD))
    draw.text((28, y + 12), title, fill=hex_rgb(TEXT_SEC), font=fonts["small"])
    body_fn(y + 36)
    return y + h + 12


def screen_dashboard(lang: str) -> Image.Image:
    img = Image.new("RGB", (W, H), hex_rgb(BG))
    draw = ImageDraw.Draw(img)
    fonts = {
        "title": load_font(20, True),
        "sub": load_font(13),
        "body": load_font(15),
        "small": load_font(13, True),
        "tiny": load_font(10),
        "icon": load_font(20),
        "stat": load_font(13, True),
        "stat_label": load_font(11),
    }
    if lang == "ko":
        draw_header(draw, fonts, "가계부", "2026년 가계 관리")
        month = "2026년 6월"
        tabs = [("📊", "요약"), ("📋", "내역"), ("📅", "달력"), ("⚙️", "설정")]
        summary_title = "6월 요약"
        labels = ("지출", "수입", "잔액")
        values = ("45,780원", "280,000원", "234,220원")
        chart_title = "일별 지출 추이"
        method_title = "결제수단별 지출"
        methods = [("카드", "28,400원"), ("페이페이", "12,380원"), ("현금", "5,000원")]
        schedule_title = "이번 달 일정"
        work = "勤 출근일 20일"
        rest = "休 휴일 10일"
    else:
        draw_header(draw, fonts, "家計簿", "2026年 家計管理")
        month = "2026年6月"
        tabs = [("📊", "概要"), ("📋", "明細"), ("📅", "カレンダー"), ("⚙️", "設定")]
        summary_title = "6月の概要"
        labels = ("支出", "収入", "残高")
        values = ("¥45,780", "¥280,000", "¥234,220")
        chart_title = "日別支出推移"
        method_title = "決済手段別支出"
        methods = [("カード", "¥28,400"), ("PayPay", "¥12,380"), ("現金", "¥5,000")]
        schedule_title = "今月の予定"
        work = "勤 出勤日 20日"
        rest = "休 休日 10日"

    draw_month_selector(draw, fonts, month)
    y = 152

    def summary_body(oy):
        xs = [28, 148, 268]
        colors = [EXPENSE, INCOME, PRIMARY]
        for i, (lb, val, col) in enumerate(zip(labels, values, colors)):
            rounded_rect(draw, (xs[i], oy, xs[i] + 96, oy + 64), 8, hex_rgb(BG))
            draw.text((xs[i] + 28, oy + 8), lb, fill=hex_rgb(TEXT_SEC), font=fonts["stat_label"])
            draw.text((xs[i] + 8, oy + 30), val, fill=hex_rgb(col), font=fonts["stat"])

    y = draw_card(draw, fonts, y, summary_title, summary_body, 110)

    def chart_body(oy):
        heights = [12, 28, 8, 45, 22, 60, 18, 35, 40, 15, 25, 55]
        for i, h in enumerate(heights):
            x = 34 + i * 26
            draw.rectangle((x, oy + 80 - h, x + 18, oy + 80), fill=hex_rgb(EXPENSE))
            draw.text((x + 4, oy + 84), str(i + 1), fill=hex_rgb(TEXT_SEC), font=fonts["tiny"])

    y = draw_card(draw, fonts, y, chart_title, chart_body, 120)

    def method_body(oy):
        for i, (name, amt) in enumerate(methods):
            yy = oy + i * 28
            draw.text((28, yy), name, fill=hex_rgb(TEXT), font=fonts["body"])
            draw.text((W - 110, yy), amt, fill=hex_rgb(EXPENSE), font=fonts["body"])
            if i < len(methods) - 1:
                draw.line((28, yy + 22, W - 28, yy + 22), fill=hex_rgb(BORDER))

    y = draw_card(draw, fonts, y, method_title, method_body, 110)

    def schedule_body(oy):
        rounded_rect(draw, (28, oy, 170, oy + 32), 12, hex_rgb(WORK_BG))
        draw.text((38, oy + 8), work, fill=hex_rgb(WORK_TX), font=fonts["body"])
        rounded_rect(draw, (190, oy, 340, oy + 32), 12, hex_rgb(REST_BG))
        draw.text((200, oy + 8), rest, fill=hex_rgb(REST_TX), font=fonts["body"])

    draw_card(draw, fonts, y, schedule_title, schedule_body, 70)
    draw_tabs(draw, fonts, tabs, 0)
    return img


def screen_transactions(lang: str) -> Image.Image:
    img = Image.new("RGB", (W, H), hex_rgb(BG))
    draw = ImageDraw.Draw(img)
    fonts = {
        "title": load_font(20, True),
        "sub": load_font(13),
        "body": load_font(14),
        "small": load_font(12),
        "tiny": load_font(10),
        "icon": load_font(20),
        "day": load_font(18, True),
    }
    if lang == "ko":
        draw_header(draw, fonts, "가계부", "2026년 가계 관리")
        month, tabs = "2026년 6월", [("📊", "요약"), ("📋", "내역"), ("📅", "달력"), ("⚙️", "설정")]
        items = [
            (25, "월급", "수입", "계좌이체", "280,000원"),
            (7, "편의점", "지출", "페이페이", "580원"),
            (7, "점심", "지출", "카드", "1,200원"),
            (12, "교통비", "지출", "카드", "320원"),
        ]
        edit, delete = "수정", "삭제"
        day_unit = "일"
    else:
        draw_header(draw, fonts, "家計簿", "2026年 家計管理")
        month, tabs = "2026年6月", [("📊", "概要"), ("📋", "明細"), ("📅", "カレンダー"), ("⚙️", "設定")]
        items = [
            (25, "給与", "収入", "口座振込", "¥280,000"),
            (7, "コンビニ", "支出", "PayPay", "¥580"),
            (7, "ランチ", "支出", "カード", "¥1,200"),
            (12, "交通費", "支出", "カード", "¥320"),
        ]
        edit, delete = "修正", "削除"
        day_unit = "日"

    draw_month_selector(draw, fonts, month)
    y = 160
    for day, desc, typ, method, amt in items:
        rounded_rect(draw, (16, y, W - 16, y + 78), 12, hex_rgb(CARD))
        rounded_rect(draw, (24, y + 12, 64, y + 64), 8, hex_rgb(BG))
        draw.text((36, y + 16), str(day), fill=hex_rgb(PRIMARY), font=fonts["day"])
        draw.text((40, y + 40), day_unit, fill=hex_rgb(TEXT_SEC), font=fonts["tiny"])
        draw.text((76, y + 14), desc, fill=hex_rgb(TEXT), font=fonts["body"])
        draw.text((76, y + 34), f"{typ} · {method}", fill=hex_rgb(TEXT_SEC), font=fonts["small"])
        col = INCOME if typ in ("수입", "収入") else EXPENSE
        draw.text((W - 100, y + 22), amt, fill=hex_rgb(col), font=fonts["body"])
        rounded_rect(draw, (W - 170, y + 52, W - 100, y + 72), 6, hex_rgb(BG))
        draw.text((W - 158, y + 54), edit, fill=hex_rgb(PRIMARY), font=fonts["tiny"])
        rounded_rect(draw, (W - 92, y + 52, W - 28, y + 72), 6, hex_rgb(REST_BG))
        draw.text((W - 80, y + 54), delete, fill=hex_rgb(REST_TX), font=fonts["tiny"])
        y += 88

    draw.ellipse((W - 76, H - 140, W - 20, H - 84), fill=hex_rgb(EXPENSE))
    draw.text((W - 62, H - 128), "📷", fill=(255, 255, 255), font=fonts["icon"])
    draw.ellipse((W - 76, H - 76, W - 20, H - 20), fill=hex_rgb(PRIMARY))
    draw.text((W - 58, H - 68), "+", fill=(255, 255, 255), font=load_font(28, True))
    draw_tabs(draw, fonts, tabs, 1)
    return img


def screen_calendar(lang: str) -> Image.Image:
    img = Image.new("RGB", (W, H), hex_rgb(BG))
    draw = ImageDraw.Draw(img)
    fonts = {
        "title": load_font(20, True),
        "sub": load_font(13),
        "body": load_font(13),
        "small": load_font(11),
        "tiny": load_font(9),
        "icon": load_font(20),
    }
    if lang == "ko":
        draw_header(draw, fonts, "가계부", "2026년 가계 관리")
        month, tabs = "2026년 6월", [("📊", "요약"), ("📋", "내역"), ("📅", "달력"), ("⚙️", "설정")]
        detail = "6월 7일 (일)"
        exp_label, inc_label = "실지출", "실수입"
        exp_val, inc_val = "1,780원", "0원"
        tx1, tx2 = "편의점 · 페이페이", "점심 · 카드"
    else:
        draw_header(draw, fonts, "家計簿", "2026年 家計管理")
        month, tabs = "2026年6月", [("📊", "概要"), ("📋", "明細"), ("📅", "カレンダー"), ("⚙️", "設定")]
        detail = "6月7日 (日)"
        exp_label, inc_label = "実支出", "実収入"
        exp_val, inc_val = "¥1,780", "¥0"
        tx1, tx2 = "コンビニ · PayPay", "ランチ · カード"

    draw_month_selector(draw, fonts, month)
    headers = ["日", "月", "火", "水", "木", "金", "土"]
    y0 = 158
    rounded_rect(draw, (16, y0, W - 16, y0 + 250), 12, hex_rgb(CARD))
    for i, h in enumerate(headers):
        draw.text((30 + i * 48, y0 + 10), h, fill=hex_rgb(TEXT_SEC), font=fonts["small"])
    # June 2026 starts Sunday
    days = list(range(1, 31))
    for idx, d in enumerate(days):
        row, col = divmod(idx, 7)
        x, y = 24 + col * 48, y0 + 36 + row * 34
        fill = hex_rgb(PRIMARY) if d == 7 else hex_rgb(REST_BG if d in (6, 7, 13, 14, 20, 21, 27, 28) else BG)
        rounded_rect(draw, (x, y, x + 40, y + 30), 6, fill)
        tc = (255, 255, 255) if d == 7 else hex_rgb(REST_TX if d in (6, 7, 13, 14, 20, 21, 27, 28) else TEXT)
        draw.text((x + 14, y + 4), str(d), fill=tc, font=fonts["body"])
        if d == 7:
            draw.text((x + 10, y + 18), "2k", fill=(255, 220, 220), font=fonts["tiny"])

    y = 424
    rounded_rect(draw, (16, y, W - 16, y + 200), 12, hex_rgb(CARD))
    draw.text((28, y + 12), detail, fill=hex_rgb(TEXT), font=fonts["body"])
    draw.text((28, y + 40), exp_label, fill=hex_rgb(TEXT_SEC), font=fonts["small"])
    draw.text((120, y + 40), exp_val, fill=hex_rgb(EXPENSE), font=fonts["body"])
    draw.text((220, y + 40), inc_label, fill=hex_rgb(TEXT_SEC), font=fonts["small"])
    draw.text((300, y + 40), inc_val, fill=hex_rgb(INCOME), font=fonts["body"])
    draw.line((28, y + 68, W - 28, y + 68), fill=hex_rgb(BORDER))
    draw.text((28, y + 82), tx1, fill=hex_rgb(TEXT), font=fonts["body"])
    draw.text((W - 80, y + 82), "580", fill=hex_rgb(EXPENSE), font=fonts["body"])
    draw.text((28, y + 110), tx2, fill=hex_rgb(TEXT), font=fonts["body"])
    draw.text((W - 80, y + 110), "1,200", fill=hex_rgb(EXPENSE), font=fonts["body"])

    draw.ellipse((W - 76, H - 140, W - 20, H - 84), fill=hex_rgb(EXPENSE))
    draw.text((W - 62, H - 128), "📷", fill=(255, 255, 255), font=fonts["icon"])
    draw.ellipse((W - 76, H - 76, W - 20, H - 20), fill=hex_rgb(PRIMARY))
    draw.text((W - 58, H - 68), "+", fill=(255, 255, 255), font=load_font(28, True))
    draw_tabs(draw, fonts, tabs, 2)
    return img


def screen_add_transaction(lang: str) -> Image.Image:
    img = Image.new("RGB", (W, H), (0, 0, 0, 128))
    base = Image.new("RGB", (W, H), hex_rgb(BG))
    draw = ImageDraw.Draw(base)
    fonts = {
        "title": load_font(20, True),
        "sub": load_font(13),
        "body": load_font(14),
        "small": load_font(12),
        "icon": load_font(20),
    }
    draw_header(draw, fonts, "가계부" if lang == "ko" else "家計簿", "2026년 가계 관리" if lang == "ko" else "2026年 家計管理")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 120))
    base = base.convert("RGBA")
    base = Image.alpha_composite(base, overlay)
    draw = ImageDraw.Draw(base)
    panel_y = 180
    rounded_rect(draw, (0, panel_y, W, H), 16, hex_rgb(CARD))
    if lang == "ko":
        title = "내역 추가"
        fields = [
            ("구분", "지출  |  수입"),
            ("날짜", "2026년 6월 7일"),
            ("결제수단", "카드  현금  페이페이"),
            ("금액", "1,200"),
            ("내용", "점심"),
            ("비고", "메모 (선택)"),
        ]
        cancel, save = "취소", "저장"
    else:
        title = "明細追加"
        fields = [
            ("区分", "支出  |  収入"),
            ("日付", "2026年6月7日"),
            ("決済手段", "カード  現金  PayPay"),
            ("金額", "1,200"),
            ("内容", "ランチ"),
            ("備考", "メモ（任意）"),
        ]
        cancel, save = "キャンセル", "保存"

    draw.text((20, panel_y + 16), title, fill=hex_rgb(TEXT), font=fonts["title"])
    y = panel_y + 56
    for label, value in fields:
        draw.text((20, y), label, fill=hex_rgb(TEXT_SEC), font=fonts["small"])
        rounded_rect(draw, (20, y + 18, W - 20, y + 52), 8, hex_rgb(BG))
        draw.text((28, y + 28), value, fill=hex_rgb(TEXT), font=fonts["body"])
        y += 62
    rounded_rect(draw, (20, H - 90, W // 2 - 8, H - 50), 8, hex_rgb(BG))
    draw.text((W // 4 - 20, H - 78), cancel, fill=hex_rgb(TEXT_SEC), font=fonts["body"])
    rounded_rect(draw, (W // 2 + 8, H - 90, W - 20, H - 50), 8, hex_rgb(PRIMARY))
    draw.text((W // 2 + 80, H - 78), save, fill=(255, 255, 255), font=fonts["body"])
    return base.convert("RGB")


def screen_receipt_scan(lang: str) -> Image.Image:
    img = Image.new("RGB", (W, H), hex_rgb(BG))
    draw = ImageDraw.Draw(img)
    fonts = {
        "title": load_font(20, True),
        "sub": load_font(13),
        "body": load_font(14),
        "small": load_font(12),
        "icon": load_font(20),
    }
    draw_header(draw, fonts, "가계부" if lang == "ko" else "家計簿", "2026년 가계 관리" if lang == "ko" else "2026年 家計管理")
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 120))
    img = img.convert("RGBA")
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)
    panel_y = 220
    rounded_rect(draw, (0, panel_y, W, H), 16, hex_rgb(CARD))
    if lang == "ko":
        title = "인식 결과"
        rows = [("가게", "세븐일레븐"), ("금액", "580원"), ("날짜", "2026년 6월 7일"), ("결제", "페이페이"), ("분류", "식비")]
        btns = ("취소", "수정 후 저장", "자동 등록")
    else:
        title = "認識結果"
        rows = [("店舗", "セブンイレブン"), ("金額", "¥580"), ("日付", "2026年6月7日"), ("決済", "PayPay"), ("分類", "食費")]
        btns = ("キャンセル", "修正して保存", "自動登録")

    draw.text((20, panel_y + 12), title, fill=hex_rgb(TEXT), font=fonts["title"])
    rounded_rect(draw, (20, panel_y + 44, W - 20, panel_y + 160), 10, hex_rgb(BG))
    draw.text((40, panel_y + 80), "RECEIPT", fill=hex_rgb(TEXT_SEC), font=load_font(24, True))
    rounded_rect(draw, (20, panel_y + 172, W - 20, panel_y + 320), 10, hex_rgb(BG))
    y = panel_y + 182
    for label, val in rows:
        draw.text((28, y), label, fill=hex_rgb(TEXT_SEC), font=fonts["small"])
        col = EXPENSE if label in ("금액", "金額") else TEXT
        draw.text((W - 140, y), val, fill=hex_rgb(col), font=fonts["body"])
        draw.line((28, y + 22, W - 28, y + 22), fill=hex_rgb(BORDER))
        y += 28
    bx = 20
    for i, btn in enumerate(btns):
        fill = PRIMARY if i == 2 else CARD
        rounded_rect(draw, (bx, H - 100, bx + 110, H - 60), 8, hex_rgb(fill))
        tc = (255, 255, 255) if i == 2 else TEXT
        draw.text((bx + 12, H - 86), btn, fill=hex_rgb(tc) if i != 2 else (255, 255, 255), font=fonts["small"])
        bx += 118
    return img.convert("RGB")


def screen_settings(lang: str) -> Image.Image:
    img = Image.new("RGB", (W, H), hex_rgb(BG))
    draw = ImageDraw.Draw(img)
    fonts = {
        "title": load_font(20, True),
        "sub": load_font(13),
        "body": load_font(13),
        "small": load_font(12),
        "icon": load_font(20),
        "tiny": load_font(10),
    }
    if lang == "ko":
        draw_header(draw, fonts, "가계부", "2026년 가계 관리")
        tabs = [("📊", "요약"), ("📋", "내역"), ("📅", "달력"), ("⚙️", "설정")]
        sections = [
            ("화면 언어", ["한국어", "日本語", "English"]),
            ("엑셀 연동", ["📂 엑셀 파일 가져오기", "📥 엑셀 파일보내기"]),
            ("예상 지출 설정", ["평일 (勤): 1000", "휴일 (休): 5000"]),
            ("저축 계획", ["월급: 280,000", "월세: 80,000", "월 고정 지출: 120,000"]),
        ]
        save_btn = "설정 저장"
    else:
        draw_header(draw, fonts, "家計簿", "2026年 家計管理")
        tabs = [("📊", "概要"), ("📋", "明細"), ("📅", "カレンダー"), ("⚙️", "設定")]
        sections = [
            ("表示言語", ["한국어", "日本語", "English"]),
            ("Excel連携", ["📂 Excelファイル取込", "📥 Excelファイル出力"]),
            ("予想支出設定", ["平日 (勤): 1000", "休日 (休): 5000"]),
            ("貯蓄計画", ["月給: 280,000", "家賃: 80,000", "月固定支出: 120,000"]),
        ]
        save_btn = "設定保存"

    y = 100
    for title, lines in sections:
        h = 56 + len(lines) * 28
        rounded_rect(draw, (16, y, W - 16, y + h), 12, hex_rgb(CARD))
        draw.text((28, y + 10), title, fill=hex_rgb(TEXT_SEC), font=fonts["body"])
        for i, line in enumerate(lines):
            ly = y + 36 + i * 28
            if title.endswith("언어") or title == "表示言語":
                active = (lang == "ko" and line == "한국어") or (lang == "ja" and line == "日本語")
                fill = PRIMARY if active else BG
                tc = (255, 255, 255) if active else TEXT
                rounded_rect(draw, (28 + i * 110, ly, 28 + i * 110 + 100, ly + 32), 8, hex_rgb(fill))
                draw.text((48 + i * 110, ly + 8), line, fill=hex_rgb(tc) if not active else (255, 255, 255), font=fonts["small"])
            else:
                rounded_rect(draw, (28, ly, W - 28, ly + 30), 8, hex_rgb(BG))
                draw.text((36, ly + 8), line, fill=hex_rgb(TEXT), font=fonts["small"])
        y += h + 10

    rounded_rect(draw, (16, y, W - 16, y + 44), 8, hex_rgb(PRIMARY))
    draw.text((W // 2 - 40, y + 12), save_btn, fill=(255, 255, 255), font=fonts["body"])
    draw_tabs(draw, fonts, tabs, 3)
    return img


SCREENS = {
    "dashboard": screen_dashboard,
    "transactions": screen_transactions,
    "calendar": screen_calendar,
    "add-transaction": screen_add_transaction,
    "receipt-scan": screen_receipt_scan,
    "settings": screen_settings,
}


def main():
    manifest = {"source": "pillow_mockup", "screens": {}}
    for lang in ("ko", "ja"):
        out_dir = OUT / lang
        out_dir.mkdir(parents=True, exist_ok=True)
        manifest["screens"][lang] = []
        for name, fn in SCREENS.items():
            path = out_dir / f"{name}.png"
            fn(lang).save(path, "PNG")
            manifest["screens"][lang].append(str(path.relative_to(ROOT)))
            print(f"Wrote {path}")

    manifest_path = OUT / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {manifest_path}")


if __name__ == "__main__":
    main()
