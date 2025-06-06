import { Error } from '../errors/Error';
import { Reader } from './reader/Reader';
import { Token, TokenType } from './token/Token';
import { idRule, isIdChar } from './rules/Id';
import { digit, numberRule } from './rules/Number';
import { checkReserved } from './rules/ReservedWords';
import { isQuot, stringRule } from './rules/String';
import { isSpecialChar, specialCharRule } from './rules/SpecialChars';

/**
 * Лексический анализатор, который разбивает входную строку на токены
 */
export class Lexer {
  private reader: Reader;

  /**
   * Создает новый лексический анализатор
   * @param input Входная строка
   */
  constructor(input: string) {
    this.reader = new Reader(input);
  }

  /**
   * Получает следующий токен из входной строки
   */
  public get(): Token {
    this.skipWhitespaces();
    if (this.empty()) {
      return {
        type: TokenType.ERROR,
        value: '',
        pos: this.reader.count(),
        error: Error.EMPTY_INPUT
      };
    }

    const ch = this.reader.peek();

    if (isIdChar(ch)) {
      return checkReserved(this.id());
    }
    if (digit(ch)) {
      return this.number();
    }
    if (isQuot(ch)) {
      return this.string();
    }
    if (isSpecialChar(ch)) {
      return this.specialChar();
    }

    return {
      type: TokenType.ERROR,
      value: ch,
      pos: this.reader.count(),
      error: Error.UNKNOWN_SYMBOL
    };
  }

  /**
   * Возвращает следующий токен без его удаления из потока
   */
  public peek(): Token {
    const pos = this.reader.count();
    const token = this.get();
    this.reader.seek(pos);
    return token;
  }

  /**
   * Проверяет, достигнут ли конец входной строки
   */
  public empty(): boolean {
    this.skipWhitespaces();
    return this.reader.empty();
  }

  /**
   * Обрабатывает идентификатор
   * @private
   */
  private id(): Token {
    const startPos = this.reader.count();
    this.reader.record();
    if (!idRule(this.reader)) {
      return {
        type: TokenType.ERROR,
        value: '',
        pos: startPos,
        error: Error.INVALID_ID
      };
    }

    return {
      type: TokenType.ID,
      value: this.reader.stopRecord(),
      pos: startPos,
      error: Error.NONE
    };
  }

  /**
   * Обрабатывает числовой литерал
   * @private
   */
  private number(): Token {
    const startPos = this.reader.count();
    this.reader.record();
    const isInteger = { value: false };
    
    if (!numberRule(this.reader, isInteger)) {
      return {
        type: TokenType.ERROR,
        value: '',
        pos: startPos,
        error: Error.INVALID_NUMBER
      };
    }

    return {
      type: isInteger.value ? TokenType.INTEGER : TokenType.FLOAT,
      value: this.reader.stopRecord(),
      pos: startPos,
      error: Error.NONE
    };
  }

  /**
   * Обрабатывает строковый литерал
   * @private
   */
  private string(): Token {
    const startPos = this.reader.count();
    this.reader.record();
    
    if (!stringRule(this.reader)) {
      return {
        type: TokenType.ERROR,
        value: '',
        pos: startPos,
        error: Error.STRING_LITERAL_INCOMPLETE
      };
    }

    return {
      type: TokenType.STRING_LITERAL,
      value: this.reader.stopRecord(),
      pos: startPos,
      error: Error.NONE
    };
  }

  /**
   * Обрабатывает специальный символ
   * @private
   */
  private specialChar(): Token {
    const startPos = this.reader.count();
    this.reader.record();
    
    const tokenType = specialCharRule(this.reader);
    
    return {
      type: tokenType,
      value: this.reader.stopRecord(),
      pos: startPos,
      error: Error.NONE
    };
  }

  /**
   * Пропускает пробелы во входной строке
   * @private
   */
  private skipWhitespaces(): void {
    while (!this.reader.empty() && this.reader.peek() === ' ') {
      this.reader.get();
    }
  }
} 