import { ch1 } from './ch1'
import { ch2 } from './ch2'
import { ch3 } from './ch3'
import { ch4 } from './ch4'
import { ch5 } from './ch5'
import { chMalatya } from './chMalatya'
import { chRize } from './chRize'
import { chOrdu } from './chOrdu'
import { chKonya } from './chKonya'
import { chAntalya } from './chAntalya'
import { chSanliurfa } from './chSanliurfa'
import { chErzurum } from './chErzurum'
import type { ChapterDef } from './engine'

export const CHAPTERS: ChapterDef[] = [ch1, ch2, ch3, ch4, ch5]
/** İllerin özel bölümleri (Aydın kampanyasının dışında, il sahnesinde oynar). */
export const OZEL: ChapterDef[] = [chMalatya, chRize, chOrdu, chKonya, chAntalya, chSanliurfa, chErzurum]
export const ozelOf = (il: string) => OZEL.find((c) => c.il === il)
export const chapterById = (id: number) => [...CHAPTERS, ...OZEL].find((c) => c.id === id)!
