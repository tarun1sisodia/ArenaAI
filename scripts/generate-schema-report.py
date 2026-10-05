import json
from pathlib import Path

src = Path('/home/ubuntu/.mcp/tool-results/2026-10-05_15-24-10.256481768_supabase_list_tables_832f3db2.json')
out = Path('/home/ubuntu/ArenaAI/reports/live-schema-inventory.md')
data = json.loads(src.read_text())
lines = ['# ArenaAI live Supabase schema inventory', '', 'Generated from the live Supabase `list_tables` inspection on 2026-10-05.', '', '## Table summary', '', '| Table | Rows | RLS | Primary key |', '|---|---:|:---:|---|']
for table in data['tables']:
    lines.append(f"| `{table['name']}` | {table.get('rows', '—')} | {'enabled' if table.get('rls_enabled') else 'DISABLED'} | {', '.join('`'+x+'`' for x in table.get('primary_keys', [])) or '—'} |")
lines += ['', '## Columns and types', '']
for table in data['tables']:
    lines += [f"### `{table['name']}`", '', '| Column | PostgreSQL type | Nullable | Default | Check / enum |', '|---|---|:---:|---|---|']
    for col in table.get('columns', []):
        options = set(col.get('options', []))
        nullable = 'yes' if 'nullable' in options else 'no'
        typ = col.get('format') or col.get('data_type', '—')
        check = col.get('check', '')
        if col.get('enums'):
            check = 'enum: ' + ', '.join(col['enums'])
        default = str(col.get('default_value', '—')).replace('|', '\\|')
        check = str(check or '—').replace('|', '\\|')
        lines.append(f"| `{col['name']}` | `{typ}` | {nullable} | `{default}` | {check} |")
    fks = table.get('foreign_key_constraints', [])
    if fks:
        lines += ['', '**Foreign keys:**', '', '| Constraint | Source | Target |', '|---|---|---|']
        for fk in fks:
            src_cols = ', '.join(f'`{x}`' for x in fk.get('source_columns', []))
            tgt_cols = ', '.join(f'`{x}`' for x in fk.get('target_columns', []))
            lines.append(f"| `{fk['name']}` | `{fk['source_table']}` ({src_cols}) | `{fk['target_table']}` ({tgt_cols}) |")
    lines.append('')
lines += ['## Live advisory', '', '> **Critical:** RLS is disabled on 12 tables. Do not enable RLS without reviewed policies; enabling it without policies will block access. The backend currently uses direct PostgreSQL repositories, while Supabase client roles can still access these tables if exposed.', '', data.get('advisory', {}).get('remediation_sql', '')]
out.write_text('\n'.join(lines) + '\n')
print(out)
print(f"tables={len(data['tables'])}")
