import { describe, it, expect } from 'vitest'
import { safeParseJson } from './json-parser'

describe('safeParseJson', () => {
  it('parse un objet JSON pur', () => {
    const parsed = safeParseJson('{"foo": "bar", "n": 1}')
    expect(parsed).toEqual({ foo: 'bar', n: 1 })
  })

  it('parse un tableau JSON pur', () => {
    const parsed = safeParseJson('[1, 2, 3]')
    expect(parsed).toEqual([1, 2, 3])
  })

  it('extrait un objet JSON entouré de texte', () => {
    const response = 'Voici le résultat :\n{"key": "value"}\nVoilà !'
    expect(safeParseJson(response)).toEqual({ key: 'value' })
  })

  it('extrait un objet JSON entouré de fences markdown', () => {
    const response = '```json\n{"ok": true}\n```'
    expect(safeParseJson(response)).toEqual({ ok: true })
  })

  it('gère un JSON imbriqué avec objets et tableaux', () => {
    const response = '{"items": [{"id": 1}, {"id": 2}], "meta": {"total": 2}}'
    expect(safeParseJson(response)).toEqual({
      items: [{ id: 1 }, { id: 2 }],
      meta: { total: 2 },
    })
  })

  it('gère les chaînes de caractères multi-ligne', () => {
    const response = '{\n  "a": 1,\n  "b": "hello"\n}'
    expect(safeParseJson(response)).toEqual({ a: 1, b: 'hello' })
  })

  it("lève une erreur quand aucun JSON n'est présent", () => {
    expect(() => safeParseJson('pas de json ici')).toThrow(/Aucun JSON trouvé/)
  })

  it('lève une erreur quand la chaîne est vide', () => {
    expect(() => safeParseJson('')).toThrow(/Aucun JSON trouvé/)
  })

  it('lève une erreur JSON.parse si le JSON est mal formé', () => {
    expect(() => safeParseJson('{foo: bar}')).toThrow()
  })

  it("privilégie l'objet quand objet et tableau sont présents", () => {
    // Comportement actuel : la regex /{.*}|[.*]/ matche le premier qui survient
    const response = 'texte {"obj": 1} et [1,2]'
    const parsed = safeParseJson(response)
    expect(parsed).toMatchObject({ obj: 1 })
  })

  describe('priorité fenced block markdown', () => {
    it('privilégie le contenu du fence ```json même si un autre JSON existe autour', () => {
      const response = '{"wrapper": "ignoré"}\n```json\n{"fenced": true}\n```\ntexte final'
      expect(safeParseJson(response)).toEqual({ fenced: true })
    })

    it('supporte le tag de langue en majuscules (```JSON)', () => {
      const response = '```JSON\n{"ok": 1}\n```'
      expect(safeParseJson(response)).toEqual({ ok: 1 })
    })

    it('supporte un fence sans tag de langue', () => {
      const response = '```\n{"plain": "fence"}\n```'
      expect(safeParseJson(response)).toEqual({ plain: 'fence' })
    })

    it('supporte un tableau dans un fence', () => {
      const response = '```json\n[1, 2, 3]\n```'
      expect(safeParseJson(response)).toEqual([1, 2, 3])
    })
  })

  describe('fallback JSON.parse direct', () => {
    it('parse directement une entrée JSON valide avec espaces', () => {
      const response = '   {"direct": "parse"}   '
      expect(safeParseJson(response)).toEqual({ direct: 'parse' })
    })

    it('tombe sur le regex fallback si fence absent et parse direct échoue', () => {
      const response = 'blabla {"fallback": "regex"} blabla'
      expect(safeParseJson(response)).toEqual({ fallback: 'regex' })
    })
  })
})
