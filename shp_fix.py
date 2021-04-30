
def find_escape(s, esc=b'\xc3'):
    x=[]
    i=s.find(esc)
    while i >= 0:
        x.append((i, s[i:i+4]))
        i = s.find(esc, i+1)

    return x

def high_chars(ch, threshold=0x80, skip=320):
    high = [i for i,c in enumerate(ch) if c>=threshold and i > skip]
    high_paired = high[:1]
    for i in range(1,len(high)):
        if high[i] != high_paired[-1]+1:
            high_paired.append(high[i])
    return high_paired
# [ch[i-2:i+4].decode() for i in high_chars(ch) if ch[i] not in b'\xc2\xc3']

def replace_escape(s):
    return s.replace(b'\xc3\x82\xc2',b'\xc2').replace(b'\xc3\x83\xc2',b'\xc3')

#%%
#% Write directly. Doesn't work due to broken binary encoding

# with open("swisscantonsmod/ch-cantons.dbf", "rb") as dbf:
#     ch = dbf.read()

# {s for i, s in find_escape(ch)}

# with open("swisscantonsmod/ch-cantons.dbf", "wb") as dbf:
#     dbf.write(replace_escape(ch))

#%%

import shapefile

sf = shapefile.Reader("swisscantonsmod/ch-cantons.dbf")
print(f"records: {len(sf.records())}")
print(f"shapes: {len(sf.shapes())}")
out = shapefile.Writer("swisscantonsmod/ch-cantons_fixed.dbf")
for f in sf.fields:
    out.field(*f)

def clean_rec(rec):
    return tuple(replace_escape(r.encode()).decode() if isinstance(r, str) else r for r in rec)

for rec in sf.records():
    out.record(*clean_rec(rec))

for shape in sf.shapes():
    out.shape(shape)
