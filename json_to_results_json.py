#!/bin/bash

from __future__ import print_function
import json
import re
import sys
import os

# any forms of these should not be coerced to numbers
ID_KEY_ROOTS = ('videoid', 'videoownerid', 'pageid', 'userid', 'uid', 'fbid', 'ownerid', 'symbol')
FNM_DATA_ROOT= 'data'
FNM_METADATA_ROOT= 'metadata'
date_patt = r'\d{4}-\d{2}-\d{2}'
fnm_prefix = sys.argv[1] if len(sys.argv) > 1 else ''

fnm_data = '{}_{}.json'.format(fnm_prefix, FNM_DATA_ROOT) if fnm_prefix != '' else FNM_DATA_ROOT
fnm_metadata = '{}_{}.json'.format(fnm_prefix, FNM_METADATA_ROOT) if fnm_prefix != '' else FNM_METADATA_ROOT

def coerce(in_key, in_val):

	if in_key.replace('_', '').lower() in ID_KEY_ROOTS:
		return in_val or ''

	if in_val in ('NaN', 'Infinity'):
		return None

	try:
		return json.loads(in_val)
	except ValueError:
		return in_val

def sniff_type(in_val):

	if in_val in ('', None):
		return None

	if isinstance(in_val, float):
		out_type = 'number'
	elif isinstance(in_val, int):
		out_type = 'number'
	else:
		out_type = 'string'

	return out_type

all_records = []
all_dims = {}

for line in sys.stdin:

	out = {}

	row = json.loads(line)

	for k,v in row.items():

		coerced_v = coerce(k, v)

		# out[k] = {
		# 	# TODO: coerce type
		# 	"value": coerced_v
		# }
		out[k] = coerced_v

		existing_dim = all_dims.get(k)
		# add if new, or update type if not a string (which shouldn't be updated)
		if not existing_dim or existing_dim.get('type') != 'string':
			all_dims[k] = {
				# TODO: sniff type
				"type": sniff_type(coerced_v),
				"label_short": k
			}

		# print(json.dumps(all_dims), file=sys.stderr)
	
	all_records.append(out)


with open("../datasets/{}".format(fnm_data), "w") as f:
	print(json.dumps({"data": all_records}), file=f)

out_dims = []
for k,v in all_dims.items():
	cur_dim = {"name": k}
	for k2,v2 in v.items():
		if k2 == 'type':
			if v2 == None:
				v2 == 'string'
		cur_dim[k2] = v2
	out_dims.append(cur_dim)

with open("../datasets/{}".format(fnm_metadata), "w") as f:
	print(json.dumps({"fields": {"dimensions": out_dims}}), file=f)
