import { CORPUS } from './corpus';
import { BPE_CORPUS } from './bpeCorpus';
import { trainNgram } from '@/lib/ngram';
import { learnBpe } from '@/lib/bpe';

/** Игрушечная языковая модель курса — обучена на всём корпусе при загрузке модуля. */
export const NGRAM_MODEL = trainNgram(CORPUS);

/** Игрушечный BPE-токенизатор курса: 60 слияний. */
export const BPE_MODEL = learnBpe(BPE_CORPUS, 60);
