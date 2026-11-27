export type Verse = { text: string; reference: string }

export const VERSES: Verse[] = [
  { text: 'O Senhor é meu pastor, nada me faltará.', reference: 'Salmo 23,1' },
  { text: 'Tudo posso naquele que me fortalece.', reference: 'Filipenses 4,13' },
  {
    text: 'Vinde a mim, todos vós que estais cansados e sobrecarregados, e eu vos aliviarei.',
    reference: 'Mateus 11,28',
  },
  { text: 'Eu sou o caminho, a verdade e a vida.', reference: 'João 14,6' },
  {
    text: 'Buscai primeiro o Reino de Deus e a sua justiça, e todas essas coisas vos serão dadas por acréscimo.',
    reference: 'Mateus 6,33',
  },
  { text: 'Lâmpada para os meus pés é a tua palavra, e luz para o meu caminho.', reference: 'Salmo 119,105' },
  {
    text: 'Deus amou tanto o mundo que deu o seu Filho único, para que todo o que nele crer não pereça, mas tenha a vida eterna.',
    reference: 'João 3,16',
  },
  { text: 'O amor é paciente, o amor é bondoso.', reference: '1 Coríntios 13,4' },
  { text: 'Alegrai-vos sempre no Senhor. Repito: alegrai-vos!', reference: 'Filipenses 4,4' },
  {
    text: 'Onde dois ou três estiverem reunidos em meu nome, eu estou ali no meio deles.',
    reference: 'Mateus 18,20',
  },
  { text: 'Confia no Senhor de todo o teu coração.', reference: 'Provérbios 3,5' },
  { text: 'Eis-me aqui, Senhor, envia-me.', reference: 'Isaías 6,8' },
  { text: 'Faça-se em mim segundo a tua palavra.', reference: 'Lucas 1,38' },
  { text: 'Fazei tudo o que ele vos disser.', reference: 'João 2,5' },
  { text: 'Eu estarei convosco todos os dias, até o fim do mundo.', reference: 'Mateus 28,20' },
  { text: 'O Senhor é minha luz e minha salvação; de quem terei medo?', reference: 'Salmo 27,1' },
  { text: 'Aquietai-vos e sabei que eu sou Deus.', reference: 'Salmo 46,11' },
  { text: 'Amarás o teu próximo como a ti mesmo.', reference: 'Marcos 12,31' },
  { text: 'Sede misericordiosos, como também vosso Pai é misericordioso.', reference: 'Lucas 6,36' },
  { text: 'Eu sou a luz do mundo. Quem me segue não andará nas trevas.', reference: 'João 8,12' },
  { text: 'Em todas as coisas dai graças.', reference: '1 Tessalonicenses 5,18' },
  { text: 'A alegria do Senhor é a vossa força.', reference: 'Neemias 8,10' },
  { text: 'Provai e vede como o Senhor é bom.', reference: 'Salmo 34,9' },
  {
    text: 'Não temas, porque eu estou contigo; não te assustes, porque eu sou o teu Deus.',
    reference: 'Isaías 41,10',
  },
  { text: 'Permanecei no meu amor.', reference: 'João 15,9' },
  { text: 'Felizes os puros de coração, porque verão a Deus.', reference: 'Mateus 5,8' },
  { text: 'Vós sois o sal da terra e a luz do mundo.', reference: 'Mateus 5,13-14' },
  { text: 'Entrega o teu caminho ao Senhor, confia nele, e ele agirá.', reference: 'Salmo 37,5' },
  { text: 'Pedi e vos será dado; buscai e achareis; batei e a porta vos será aberta.', reference: 'Mateus 7,7' },
  { text: 'Deus é amor: quem permanece no amor permanece em Deus.', reference: '1 João 4,16' },
  { text: 'A minha graça te basta.', reference: '2 Coríntios 12,9' },
]

export function getVerseOfTheDay(date = new Date()): Verse {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86_400_000)
  return VERSES[dayOfYear % VERSES.length]
}
