/*
  # Product color and dimension options

  1. Colors
    - Ensure existing products have the default four choices: black, white, gray, red.

  2. Dimensions
    - Store two selectable width/height options inside the existing `dimensions` jsonb field.
    - This avoids a new table/column and keeps old products compatible.
*/

update public.products
set colors = '[
  {"name": "Black", "value": "#111111"},
  {"name": "White", "value": "#ffffff"},
  {"name": "Gray", "value": "#808080"},
  {"name": "Red", "value": "#b91c1c"}
]'::jsonb
where colors is null
  or jsonb_typeof(colors) <> 'array'
  or jsonb_array_length(
    case
      when jsonb_typeof(colors) = 'array'
        then colors
      else '[]'::jsonb
    end
  ) < 4;

with normalized_dimensions as (
  select
    id,
    coalesce(dimensions, '{}'::jsonb) as dims,
    case
      when coalesce(dimensions->>'width', '') ~ '^[0-9]+(\.[0-9]+)?$'
        then (dimensions->>'width')::numeric
      else 55
    end as width,
    case
      when coalesce(dimensions->>'height', '') ~ '^[0-9]+(\.[0-9]+)?$'
        then (dimensions->>'height')::numeric
      else 55
    end as height
  from public.products
)
update public.products p
set dimensions = nd.dims || jsonb_build_object(
  'options',
  jsonb_build_array(
    jsonb_build_object(
      'id', 'standard',
      'label', 'Standard',
      'width', nd.width,
      'height', nd.height
    ),
    jsonb_build_object(
      'id', 'large',
      'label', 'Large',
      'width', nd.width + 10,
      'height', nd.height
    )
  )
)
from normalized_dimensions nd
where p.id = nd.id
  and (
    p.dimensions is null
    or jsonb_typeof(p.dimensions->'options') <> 'array'
    or jsonb_array_length(
      case
        when jsonb_typeof(p.dimensions->'options') = 'array'
          then p.dimensions->'options'
        else '[]'::jsonb
      end
    ) < 2
  );
