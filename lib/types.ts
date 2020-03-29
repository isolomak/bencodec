export enum FLAG {
	INTEGER = 0x69, // 'i'
	STR_DELIMITER = 0x3A, // ':'
	LIST = 0x6C, // 'l'
	DICTIONARY = 0x64, // 'd'
	END = 0x65, // 'e'
	MINUS = 0x2d, // '-'
	PLUS = 0x2b, // '+'
	DOT = 0x2e, // '.'
}

type ItemTypes = string | number | boolean | object;
export type EncodeTypes = ItemTypes | Array<ItemTypes>;

