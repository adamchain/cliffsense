#!/usr/bin/env python3
"""
One-time prep for the official agency PDFs used by the in-app form filler.

SSA ships SSA-821/795/820 as ENCRYPTED, XFA (dynamic Adobe) PDFs. A JavaScript
filler (pdf-lib) can't read their fields in that state (it sees 0 fields and
can't even save the file). This script normalizes each form once:

  - decrypts it (SSA uses an empty owner password / permissions encryption),
  - expands object streams so pdf-lib's parser can read it,
  - strips the /XFA dynamic layer so the static AcroForm we fill is what every
    viewer renders.

The decrypted, fillable copies are committed under public/forms/ and are what the
runtime loads + fills. Re-run with: python3 scripts/prepare-official-forms.py
Requires: pip install pikepdf
"""
import pikepdf, os

FORMS = ["ssa-821", "ssa-795", "ssa-820", "va-21p-0969"]
OUT_DIR = "public/forms"

for fid in FORMS:
    src = os.path.join(OUT_DIR, f"{fid}.src.pdf")
    dst = os.path.join(OUT_DIR, f"{fid}.pdf")
    # On first run the downloaded original is <id>.pdf; keep a .src.pdf backup.
    if not os.path.exists(src) and os.path.exists(dst):
        os.rename(dst, src)
    pdf = pikepdf.open(src)
    # Strip the dynamic XFA layer so the static AcroForm is authoritative.
    try:
        acro = pdf.Root.AcroForm
        if "/XFA" in acro.keys():
            del acro.XFA
        acro.NeedAppearances = True
    except Exception as e:
        print(f"  {fid}: no AcroForm/XFA to adjust ({e})")
    pdf.save(dst, object_stream_mode=pikepdf.ObjectStreamMode.disable, normalize_content=True)
    print(f"{fid}: {os.path.getsize(dst)} bytes (fillable, decrypted)")
    pdf.close()
