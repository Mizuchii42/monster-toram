import json
import re

def transform_boss_data(input_file, output_file):
    """
    Membaca data boss flat dari JSON, mengelompokkannya berdasarkan nama,
    dan menyimpannya dalam struktur hierarkis {name, statdef[]}.
    """
    try:
        # 1. Memuat Data Sumber
        with open(input_file, 'r', encoding='utf-8') as f:
            raw_data = json.load(f)

        grouped_data = {}

        # 2. Proses Iterasi dan Pengelompokan
        for item in raw_data:
            full_name = item.get('name', '')
            
            # Regex untuk memisahkan Nama Boss dari (Difficulty)
            # Menangkap: "Nama Boss" di grup 1, dan "Difficulty" di grup 2 (opsional)
            match = re.match(r"^(.*?)(?:\((easy|normal|hard|nightmare|ultimate)\))?$", full_name, re.IGNORECASE)
            
            if match:
                base_name = match.group(1).strip()
                # Jika tidak ada suffix difficulty, asumsikan "normal" (untuk Mini Boss)
                difficulty = match.group(2).lower() if match.group(2) else "normal"
            else:
                base_name = full_name
                difficulty = "normal"

            # Inisialisasi entri jika boss belum terdaftar
            if base_name not in grouped_data:
                grouped_data[base_name] = {
                    "name": base_name,
                    "statdef": []
                }

            # 3. Konstruksi Objek Statistik (statdef)
            # Kita menyalin atribut statistik relevan ke objek baru
            stat_entry = {
                "difficulty": difficulty,
                "level": item.get('level'),
                "hp": item.get('hp'),
                "xp": item.get('xp'),
                "element": item.get('element'),
                "def": item.get('def'),
                "mdef": item.get('mdef'),
                "flee": item.get('flee'),
                "res_phys": item.get('res_phys'),
                "res_magic": item.get('res_magic'),
                "res_crit": item.get('res_crit'),
                "guard": item.get('guard'),
                "evade": item.get('evade'),
                "proration_normal": item.get('proration_normal'),
                "proration_phys": item.get('proration_phys'),
                "proration_magic": item.get('proration_magic')
            }

            # Menambahkan ke list statdef boss yang bersangkutan
            grouped_data[base_name]['statdef'].append(stat_entry)

        # 4. Konversi Hasil ke List dan Penyimpanan
        final_output = list(grouped_data.values())

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(final_output, f, indent=2, ensure_ascii=False)
        
        print(f"Transformasi sukses. Data tersimpan di '{output_file}'.")

    except Exception as e:
        print(f"Terjadi kesalahan saat memproses data: {e}")

# Eksekusi Fungsi
if __name__ == "__main__":
    # Pastikan nama file input sesuai dengan file Anda
    transform_boss_data('bos.json', 'boss.json')
