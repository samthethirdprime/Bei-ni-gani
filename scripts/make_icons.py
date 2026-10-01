#!/usr/bin/env python3
import math
import struct
import zlib
import os

def make_png(width, height, rgba_data):
    """Encodes raw RGBA bytes into a valid PNG binary file."""
    png = bytearray(b'\x89PNG\r\n\x1a\n')
    
    # IHDR
    ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
    ihdr_crc = zlib.crc32(b'IHDR' + ihdr_data) & 0xffffffff
    png.extend(struct.pack('>I', len(ihdr_data)) + b'IHDR' + ihdr_data + struct.pack('>I', ihdr_crc))
    
    # IDAT (Scanlines with filter type 0)
    raw = bytearray()
    row_bytes = width * 4
    for y in range(height):
        raw.append(0)
        start = y * row_bytes
        raw.extend(rgba_data[start : start + row_bytes])
        
    idat_data = zlib.compress(bytes(raw), 9)
    idat_crc = zlib.crc32(b'IDAT' + idat_data) & 0xffffffff
    png.extend(struct.pack('>I', len(idat_data)) + b'IDAT' + idat_data + struct.pack('>I', idat_crc))
    
    # IEND
    iend_crc = zlib.crc32(b'IEND') & 0xffffffff
    png.extend(struct.pack('>I', 0) + b'IEND' + struct.pack('>I', iend_crc))
    return bytes(png)

def make_ico(png_32_bytes):
    """Wraps a 32x32 PNG inside a standard Windows ICO structure."""
    # ICO Header: Reserved (0), Type (1 = ICO), Image count (1)
    header = struct.pack('<HHH', 0, 1, 1)
    # Directory Entry: Width, Height, Colors, Reserved, Planes, BitCount, Size, Offset
    offset = 6 + 16
    entry = struct.pack('<BBBBHHII', 32, 32, 0, 0, 1, 32, len(png_32_bytes), offset)
    return header + entry + png_32_bytes

def render_bei_gani_icon(size, is_maskable=False):
    """
    Renders the Bei Gani branded icon into an RGBA bytearray.
    Includes dark background, emerald shield badge, and high-contrast 'B?' typography.
    """
    scale = size / 512.0
    buffer = bytearray(size * size * 4)
    
    # Dimensions scaled
    cx = size / 2.0
    cy = size / 2.0
    
    # Maskable icons stay inside the safe zone (80% circle)
    content_scale = 0.78 if is_maskable else 0.95
    
    for y in range(size):
        # Normalized coordinates centered at 0, 0
        ny = (y - cy) / (content_scale * scale)
        for x in range(size):
            nx = (x - cx) / (content_scale * scale)
            
            # Base background: Dark sleek neutral #09090b with subtle emerald gradient
            base_r = 9
            base_g = 11
            base_b = 15
            
            # Distance from center
            dist_c = math.sqrt(nx*nx + ny*ny)
            
            # Subtle radial vignette
            radial = min(dist_c / 250.0, 1.0)
            cur_r = int(base_r * (1.0 - 0.3 * radial))
            cur_g = int(base_g * (1.0 - 0.2 * radial))
            cur_b = int(base_b * (1.0 - 0.2 * radial))
            cur_a = 255
            
            # Rounded corner boundary for non-maskable (standard) icons
            if not is_maskable:
                # 512x512 rounded rect with radius 108
                qx = abs(nx) - (256.0 - 108.0)
                qy = abs(ny) - (256.0 - 108.0)
                corner_d = math.sqrt(max(qx, 0.0)**2 + max(qy, 0.0)**2) + min(max(qx, qy), 0.0) - 108.0
                if corner_d > 0.0:
                    alpha_factor = max(0.0, 1.0 - corner_d)
                    if alpha_factor <= 0.0:
                        cur_a = 0
                    else:
                        cur_a = int(255 * alpha_factor)
            
            # Central Emerald Badge / Shield
            # Bounded roughly nx in [-120, 120], ny in [-150, 160]
            # Shield shape: top rounded, sides straight down to ny=60, then tapering to point at ny=160
            in_shield = False
            shield_dist = 999.0
            
            if ny < 60:
                # Top rounded box: width 232, height 210 from ny=-150 to ny=60
                sx = abs(nx) - (116.0 - 36.0)
                sy = abs(ny - (-45.0)) - (105.0 - 36.0)
                shield_dist = math.sqrt(max(sx, 0.0)**2 + max(sy, 0.0)**2) + min(max(sx, sy), 0.0) - 36.0
            else:
                # Tapering bottom shield
                # Left line from (-116, 60) to (0, 165)
                # Right line from (116, 60) to (0, 165)
                t = (ny - 60.0) / 105.0
                half_w = 116.0 * (1.0 - 0.95 * (t ** 1.3))
                shield_dist = abs(nx) - half_w
                if ny > 165:
                    shield_dist = max(shield_dist, ny - 165)
            
            # Render shield with smooth edge
            if shield_dist <= 1.0 and cur_a > 0:
                shield_alpha = max(0.0, min(1.0, 0.5 - shield_dist))
                # Emerald gradient: #10b981 (16, 185, 129) at top to #047857 (4, 120, 87) at bottom
                prog = max(0.0, min(1.0, (ny + 150) / 315.0))
                sh_r = int(16 * (1.0 - 0.7 * prog))
                sh_g = int(185 * (1.0 - 0.35 * prog))
                sh_b = int(129 * (1.0 - 0.32 * prog))
                
                # Check for tag hole at top: cx=0, cy=-90, r=18
                hole_dist = math.sqrt(nx*nx + (ny - (-90))**2) - 16.0
                if hole_dist <= 1.0:
                    hole_alpha = max(0.0, min(1.0, 0.5 - hole_dist))
                    sh_r = int(sh_r * (1.0 - hole_alpha) + 9 * hole_alpha)
                    sh_g = int(sh_g * (1.0 - hole_alpha) + 11 * hole_alpha)
                    sh_b = int(sh_b * (1.0 - hole_alpha) + 15 * hole_alpha)
                
                # Blend shield onto background
                cur_r = int(cur_r * (1.0 - shield_alpha) + sh_r * shield_alpha)
                cur_g = int(cur_g * (1.0 - shield_alpha) + sh_g * shield_alpha)
                cur_b = int(cur_b * (1.0 - shield_alpha) + sh_b * shield_alpha)
            
            # High-Contrast "B" and "?" Monogram
            # "B" located nx in [-60, 15], ny in [-40, 70]
            # "?" located nx in [30, 75], ny in [-30, 60]
            
            # 1. Monogram 'B' (White #ffffff)
            is_b = False
            # Vertical stem: nx in [-56, -34], ny in [-32, 64]
            if -56 <= nx <= -34 and -32 <= ny <= 64:
                is_b = True
            # Top horizontal bar: nx in [-34, -2], ny in [-32, -14]
            if -34 <= nx <= -2 and -32 <= ny <= -14:
                is_b = True
            # Middle horizontal bar: nx in [-34, 4], ny in [10, 26]
            if -34 <= nx <= 4 and 10 <= ny <= 26:
                is_b = True
            # Bottom horizontal bar: nx in [-34, 4], ny in [46, 64]
            if -34 <= nx <= 4 and 46 <= ny <= 64:
                is_b = True
            # Top loop curve: outer circle cx=-2, cy=-2, r=22; inner circle r=8
            d_top_loop = math.sqrt((nx - (-2))**2 + (ny - (-2))**2)
            if nx >= -6 and 8.0 <= d_top_loop <= 22.0 and -24 <= ny <= 18:
                is_b = True
            # Bottom loop curve: outer circle cx=4, cy=38, r=24; inner circle r=8
            d_bot_loop = math.sqrt((nx - 4)**2 + (ny - 38)**2)
            if nx >= 0 and 8.0 <= d_bot_loop <= 24.0 and 16 <= ny <= 60:
                is_b = True
                
            if is_b and cur_a > 0:
                cur_r = 255
                cur_g = 255
                cur_b = 255
                
            # 2. Indicator '?' (Warm Amber / Gold: #fbbf24 = 251, 191, 36)
            is_q = False
            # Upper curve of '?': cx=48, cy=-10, r=16; arc from top to right
            d_q_top = math.sqrt((nx - 48)**2 + (ny - (-10))**2)
            if 8.0 <= d_q_top <= 18.0 and ny <= 2 and (nx >= 48 or ny <= -10):
                is_q = True
            # Downward hook of '?': nx in [41, 53], ny in [6, 26]
            if 41 <= nx <= 53 and 6 <= ny <= 26:
                is_q = True
            # Dot of '?': center at cx=47, cy=46, radius 6
            if math.sqrt((nx - 47)**2 + (ny - 46)**2) <= 6.0:
                is_q = True
                
            if is_q and cur_a > 0:
                cur_r = 251
                cur_g = 191
                cur_b = 36
            
            idx = (y * size + x) * 4
            buffer[idx] = cur_r
            buffer[idx + 1] = cur_g
            buffer[idx + 2] = cur_b
            buffer[idx + 3] = cur_a
            
    return buffer

def main():
    os.makedirs('public', exist_ok=True)
    
    # 1. 192x192 PNG Icon (Standard)
    print("Generating icon-192x192.png...")
    buf_192 = render_bei_gani_icon(192, is_maskable=False)
    png_192 = make_png(192, 192, buf_192)
    with open('public/icon-192x192.png', 'wb') as f:
        f.write(png_192)
        
    # 2. 512x512 PNG Icon (Standard)
    print("Generating icon-512x512.png...")
    buf_512 = render_bei_gani_icon(512, is_maskable=False)
    png_512 = make_png(512, 512, buf_512)
    with open('public/icon-512x512.png', 'wb') as f:
        f.write(png_512)
        
    # 3. 192x192 Maskable PNG Icon
    print("Generating icon-maskable-192x192.png...")
    buf_m192 = render_bei_gani_icon(192, is_maskable=True)
    png_m192 = make_png(192, 192, buf_m192)
    with open('public/icon-maskable-192x192.png', 'wb') as f:
        f.write(png_m192)
        
    # 4. 512x512 Maskable PNG Icon
    print("Generating icon-maskable-512x512.png...")
    buf_m512 = render_bei_gani_icon(512, is_maskable=True)
    png_m512 = make_png(512, 512, buf_m512)
    with open('public/icon-maskable-512x512.png', 'wb') as f:
        f.write(png_m512)
        
    # 5. 180x180 Apple Touch Icon (iOS Safari)
    print("Generating apple-touch-icon.png...")
    buf_180 = render_bei_gani_icon(180, is_maskable=False)
    png_180 = make_png(180, 180, buf_180)
    with open('public/apple-touch-icon.png', 'wb') as f:
        f.write(png_180)
        
    # 6. 32x32 Favicon ICO & PNG
    print("Generating favicon.ico and favicon.png...")
    buf_32 = render_bei_gani_icon(32, is_maskable=False)
    png_32 = make_png(32, 32, buf_32)
    with open('public/favicon.png', 'wb') as f:
        f.write(png_32)
    with open('public/favicon.ico', 'wb') as f:
        f.write(make_ico(png_32))
        
    print("All icons successfully generated in public/ directory.")

if __name__ == '__main__':
    main()
