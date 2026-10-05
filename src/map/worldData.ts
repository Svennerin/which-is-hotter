import type { GeometryCollection, MultiLineString, MultiPolygon, Polygon } from 'geojson'
import { feature, mesh } from 'topojson-client'
import type { GeometryCollection as TopoCollection, Topology } from 'topojson-specification'
import countries50m from 'world-atlas/countries-50m.json'

// Bundled with the app (world-atlas is Natural Earth, public domain) so the
// map never depends on a third-party host in production. 50m rather than 110m
// because the game zooms in close and 110m looks blocky at that scale.
type WorldTopology = Topology<{
  land: TopoCollection
  countries: TopoCollection
}>
const world = countries50m as unknown as WorldTopology

/** All land as one shape; drawn pale under the night shading. */
export const land = feature(world, world.objects.land) as unknown as
  | Polygon
  | MultiPolygon
  | GeometryCollection

/**
 * Only the lines *between* countries (a !== b skips coastlines, which the land
 * outline already draws). One merged line object keeps the SVG to one path.
 */
export const borders: MultiLineString = mesh(
  world,
  world.objects.countries,
  (a, b) => a !== b,
)
