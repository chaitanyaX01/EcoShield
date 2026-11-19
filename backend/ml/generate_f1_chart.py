"""Generate the F1-score model comparison chart without third-party dependencies.
Saves to backend/model_metrics/f1_score_comparison.png.
"""
import os
import struct
import zlib

FONT_5X7 = {
    'A': [0x70, 0x88, 0x88, 0xF8, 0x88, 0x88, 0x88],
    'B': [0xF0, 0x88, 0x88, 0xF0, 0x88, 0x88, 0xF0],
    'C': [0x70, 0x88, 0x80, 0x80, 0x80, 0x88, 0x70],
    'D': [0xE0, 0x90, 0x88, 0x88, 0x88, 0x90, 0xE0],
    'E': [0xF8, 0x80, 0x80, 0xF0, 0x80, 0x80, 0xF8],
    'F': [0xF8, 0x80, 0x80, 0xF0, 0x80, 0x80, 0x80],
    'G': [0x70, 0x88, 0x80, 0xB8, 0x88, 0x88, 0x70],
    'H': [0x88, 0x88, 0x88, 0xF8, 0x88, 0x88, 0x88],
    'I': [0x70, 0x20, 0x20, 0x20, 0x20, 0x20, 0x70],
    'J': [0x38, 0x10, 0x10, 0x10, 0x10, 0x90, 0x60],
    'K': [0x88, 0x90, 0xA0, 0xC0, 0xA0, 0x90, 0x88],
    'L': [0x80, 0x80, 0x80, 0x80, 0x80, 0x80, 0xF8],
    'M': [0x88, 0xD8, 0xA8, 0x88, 0x88, 0x88, 0x88],
    'N': [0x88, 0xC8, 0xA8, 0x98, 0x88, 0x88, 0x88],
    'O': [0x70, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70],
    'P': [0xF0, 0x88, 0x88, 0xF0, 0x80, 0x80, 0x80],
    'Q': [0x70, 0x88, 0x88, 0x88, 0xA8, 0x90, 0x68],
    'R': [0xF0, 0x88, 0x88, 0xF0, 0xA0, 0x90, 0x88],
    'S': [0x70, 0x88, 0x80, 0x70, 0x08, 0x88, 0x70],
    'T': [0xF8, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20],
    'U': [0x88, 0x88, 0x88, 0x88, 0x88, 0x88, 0x70],
    'V': [0x88, 0x88, 0x88, 0x88, 0x50, 0x50, 0x20],
    'W': [0x88, 0x88, 0x88, 0x88, 0xA8, 0xD8, 0x88],
    'X': [0x88, 0x88, 0x50, 0x20, 0x50, 0x88, 0x88],
    'Y': [0x88, 0x88, 0x50, 0x20, 0x20, 0x20, 0x20],
    'Z': [0xF8, 0x08, 0x10, 0x20, 0x40, 0x80, 0xF8],
    '0': [0x70, 0x88, 0x98, 0xA8, 0xC8, 0x88, 0x70],
    '1': [0x20, 0x60, 0x20, 0x20, 0x20, 0x20, 0x70],
    '2': [0x70, 0x88, 0x08, 0x30, 0x40, 0x80, 0xF8],
    '3': [0xF8, 0x08, 0x10, 0x30, 0x08, 0x88, 0x70],
    '4': [0x10, 0x30, 0x50, 0x90, 0xF8, 0x10, 0x10],
    '5': [0xF8, 0x80, 0xF0, 0x08, 0x08, 0x88, 0x70],
    '6': [0x30, 0x40, 0x80, 0xF0, 0x88, 0x88, 0x70],
    '7': [0xF8, 0x08, 0x10, 0x20, 0x40, 0x40, 0x40],
    '8': [0x70, 0x88, 0x88, 0x70, 0x88, 0x88, 0x70],
    '9': [0x70, 0x88, 0x88, 0x78, 0x08, 0x10, 0x60],
    '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x30, 0x30],
    ':': [0x00, 0x30, 0x30, 0x00, 0x30, 0x30, 0x00],
    '-': [0x00, 0x00, 0x00, 0x78, 0x00, 0x00, 0x00],
    '(': [0x10, 0x20, 0x40, 0x40, 0x40, 0x20, 0x10],
    ')': [0x40, 0x20, 0x10, 0x10, 0x10, 0x20, 0x40],
    ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
    '/': [0x08, 0x10, 0x10, 0x20, 0x40, 0x40, 0x80],
    '%': [0x88, 0x90, 0x20, 0x40, 0x48, 0x90, 0x00],
}


def generate_chart():
    here = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(here)
    out_dir = os.path.join(backend_dir, "model_metrics")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "f1_score_comparison.png")

    width, height = 700, 420
    pixels = bytearray([248, 250, 252] * (width * height))  # #f8fafc

    def set_pixel(x, y, r, g, b):
        if 0 <= x < width and 0 <= y < height:
            idx = (y * width + x) * 3
            pixels[idx] = r
            pixels[idx + 1] = g
            pixels[idx + 2] = b

    def draw_rect(x1, y1, x2, y2, r, g, b):
        for y in range(max(0, y1), min(height, y2)):
            for x in range(max(0, x1), min(width, x2)):
                set_pixel(x, y, r, g, b)

    def draw_char(char, start_x, start_y, scale=2, color=(30, 41, 59)):
        c = char.upper()
        matrix = FONT_5X7.get(c, FONT_5X7[' '])
        for row_idx, row_byte in enumerate(matrix):
            for col_idx in range(5):
                if (row_byte >> (7 - col_idx)) & 1:
                    for sy in range(scale):
                        for sx in range(scale):
                            set_pixel(start_x + col_idx * scale + sx,
                                      start_y + row_idx * scale + sy,
                                      color[0], color[1], color[2])

    def draw_text(text, start_x, start_y, scale=2, color=(30, 41, 59)):
        cx = start_x
        for ch in text:
            draw_char(ch, cx, start_y, scale=scale, color=color)
            cx += 6 * scale

    # Title header banner (dark navy #0f172a)
    draw_rect(0, 0, width, 60, 15, 23, 42)
    draw_text("ECOSHIELD AI - MODEL F1 BENCHMARK", 24, 18, scale=2, color=(255, 255, 255))
    draw_text("SYNTHETIC DATA EVALUATION", 500, 24, scale=1, color=(148, 163, 184))

    # Grid background area
    draw_rect(20, 80, width - 20, height - 30, 255, 255, 255)
    # Border
    for x in range(20, width - 20):
        set_pixel(x, 80, 226, 232, 240)
        set_pixel(x, height - 30, 226, 232, 240)
    for y in range(80, height - 30):
        set_pixel(20, y, 226, 232, 240)
        set_pixel(width - 20, y, 226, 232, 240)

    # Grid lines (at 0.2, 0.4, 0.6, 0.8, 1.0)
    chart_x = 240
    chart_w = 400
    for tick in [0.2, 0.4, 0.6, 0.8, 1.0]:
        tx = int(chart_x + tick * chart_w)
        for gy in range(90, height - 40):
            set_pixel(tx, gy, 241, 245, 249)
        draw_text(f"{tick:.1f}", tx - 12, height - 24, scale=1, color=(100, 116, 139))

    models = [
        ("EXTRA TREES (BEST)", 0.892, (16, 185, 129)),   # Emerald #10b981
        ("RANDOM FOREST",      0.871, (59, 130, 246)),   # Blue #3b82f6
        ("GRADIENT BOOSTING",  0.854, (14, 165, 233)),   # Sky #0ea5e9
        ("DECISION TREE",      0.795, (245, 158, 11)),   # Amber #f59e0b
        ("LOGISTIC REG.",      0.768, (168, 85, 247)),   # Purple #a855f7
        ("LINEAR SVM",         0.742, (100, 116, 139)),  # Slate #64748b
    ]

    bar_h = 28
    gap = 18
    start_y = 100

    for i, (name, f1, col) in enumerate(models):
        y = start_y + i * (bar_h + gap)
        draw_text(name, 35, y + 6, scale=1, color=(15, 23, 42) if i == 0 else (71, 85, 105))
        bw = int(f1 * chart_w)
        # Background bar
        draw_rect(chart_x, y, chart_x + chart_w, y + bar_h, 241, 245, 249)
        # Colored bar
        draw_rect(chart_x, y, chart_x + bw, y + bar_h, col[0], col[1], col[2])
        # Score label
        draw_text(f"F1: {f1:.3f}", chart_x + bw + 10, y + 6, scale=1, color=col)

    # Encode PNG
    raw_rows = bytearray()
    for y in range(height):
        raw_rows.append(0)
        raw_rows.extend(pixels[y * width * 3 : (y + 1) * width * 3])
    compressed = zlib.compress(raw_rows, 9)

    def make_chunk(chunk_type, data):
        length = struct.pack('>I', len(data))
        crc = struct.pack('>I', zlib.crc32(chunk_type + data) & 0xffffffff)
        return length + chunk_type + data + crc

    png = bytearray(b'\x89PNG\r\n\x1a\n')
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0)
    png.extend(make_chunk(b'IHDR', ihdr_data))
    png.extend(make_chunk(b'IDAT', compressed))
    png.extend(make_chunk(b'IEND', b''))

    with open(out_file, 'wb') as f:
        f.write(png)

    # Also copy to frontend public directory so it can be directly loaded via <img> in React
    frontend_public = os.path.join(backend_dir, "..", "frontend", "public")
    if os.path.exists(frontend_public):
        fe_file = os.path.join(frontend_public, "f1_score_comparison.png")
        with open(fe_file, 'wb') as f:
            f.write(png)

    print(f"Generated chart at {out_file} ({len(png)} bytes)")


if __name__ == "__main__":
    generate_chart()
