#!/usr/bin/env python3
"""
One-time prep for the official agency PDFs used by the in-app form filler.

SSA ships SSA-821/795/820 as ENCRYPTED, XFA (dynamic Adobe) PDFs. A JavaScript
filler (pdf-lib) can't read their fields in that state (it sees 0 fields and
can't even save the file). This script normalizes each form once:

  - downloads the official blank (cached as <id>.src.pdf, git-ignored),
  - decrypts it (SSA uses empty-password / permissions encryption),
  - expands object streams so pdf-lib's parser can read it,
  - strips the /XFA dynamic layer so the static AcroForm we fill is what every
    viewer renders.

The decrypted, fillable copies are committed under public/forms/<id>.pdf and are
what the runtime loads + fills. Re-run with:

    pip install pikepdf
    python3 scripts/prepare-official-forms.py

Matchers in lib/forms/fillable.ts are calibrated against these decrypted copies'
field tooltips, so re-running on a newer agency revision may require re-checking
them.
"""
import os
import urllib.request

import pikepdf

OUT_DIR = "public/forms"
SOURCES = {
    "ssa-821": "https://www.ssa.gov/forms/ssa-821.pdf",
    "ssa-795": "https://www.ssa.gov/forms/ssa-795.pdf",
    "ssa-820": "https://www.ssa.gov/forms/ssa-820.pdf",
    "va-21p-0969": "https://www.vba.va.gov/pubs/forms/VBA-21P-0969-ARE.pdf",
}

os.makedirs(OUT_DIR, exist_ok=True)

for fid, url in SOURCES.items():
    src = os.path.join(OUT_DIR, f"{fid}.src.pdf")
    dst = os.path.join(OUT_DIR, f"{fid}.pdf")
    if not os.path.exists(src):
        print(f"{fid}: downloading original…")
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 MyBenefitsPA"})
        with urllib.request.urlopen(req) as resp, open(src, "wb") as out:
            out.write(resp.read())

    pdf = pikepdf.open(src)
    try:
        acro = pdf.Root.AcroForm
        if "/XFA" in acro.keys():
            del acro.XFA
        acro.NeedAppearances = True
    except Exception as e:  # noqa: BLE001
        print(f"  {fid}: no AcroForm/XFA to adjust ({e})")
    pdf.save(dst, object_stream_mode=pikepdf.ObjectStreamMode.disable, normalize_content=True)
    print(f"{fid}: {os.path.getsize(dst)} bytes (fillable, decrypted)")
    pdf.close()
