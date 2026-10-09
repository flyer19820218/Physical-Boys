"""Extract only manifest-listed original PDF Image XObjects into a temporary PDF.

Usage: python extract_coordination_sources_1009_v1.py /path/to/704.pdf /new/temp/dir
Then: swift render_coordination_sources_1009_v1.swift /new/temp/dir
The full textbook PDF is never copied into the repository. Outputs refuse overwrite.
"""
from pathlib import Path
import argparse
import hashlib
import json
import logging
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, NameObject, DecodedStreamObject

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path)
parser.add_argument('output', type=Path)
args = parser.parse_args()
manifest = json.loads((Path(__file__).parent / 'ch5_coordination_1009_v1/source_manifest.json').read_text())
if hashlib.sha256(args.source.read_bytes()).hexdigest() != manifest['source']['sha256']:
    raise SystemExit('Source hash differs; inspect the new book before extracting.')
args.output.mkdir(parents=True, exist_ok=False)
logging.getLogger('pypdf').setLevel(logging.CRITICAL)
reader, writer = PdfReader(args.source), PdfWriter()
wanted = {row['object']: row for row in manifest['images']}
seen, rows = set(), []

def walk(resources):
    resources = resources.get_object() if hasattr(resources, 'get_object') else resources
    objects = resources.get('/XObject', {})
    objects = objects.get_object() if hasattr(objects, 'get_object') else objects
    for key, reference in objects.items():
        obj = reference.get_object()
        if obj.get('/Subtype') == '/Form':
            yield from walk(obj.get('/Resources', {}))
        elif obj.get('/Subtype') == '/Image':
            yield str(key)[1:], reference, obj

for pdf_page, original in enumerate(reader.pages, 1):
    for name, reference, obj in walk(original.get('/Resources', {})):
        if name not in wanted or name in seen:
            continue
        seen.add(name)
        w, h = int(obj['/Width']), int(obj['/Height'])
        assert (w, h) == (wanted[name]['width'], wanted[name]['height'])
        page = writer.add_blank_page(width=w, height=h)
        page[NameObject('/Resources')] = DictionaryObject({NameObject('/XObject'): DictionaryObject({NameObject('/Original'): reference.clone(writer)})})
        content = DecodedStreamObject()
        content.set_data(f'q {w} 0 0 {h} 0 0 cm /Original Do Q'.encode())
        page[NameObject('/Contents')] = writer._add_object(content)
        rows.append({'file': wanted[name]['file'], 'sourcePdfPage': pdf_page, 'width': w, 'height': h, 'sha256': wanted[name]['sha256']})
assert seen == set(wanted), 'Some manifest images were not found.'
with (args.output / 'objects.pdf').open('xb') as handle:
    writer.write(handle)
with (args.output / 'objects.json').open('x') as handle:
    json.dump(rows, handle, ensure_ascii=False, indent=2)
print(f'Extracted {len(rows)} original objects; full pages and teacher answers excluded.')
