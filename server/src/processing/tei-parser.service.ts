import { Injectable, Logger } from '@nestjs/common';
import {
  ParsedTei,
  TeiRoot,
  FileDesc,
  Author,
  TeiElement,
} from './types/tei.types';


@Injectable()
export class TeiParserService {
  private readonly logger = new Logger(TeiParserService.name);

  /**
   * Extracts predefined sections (title, authors, abstract, body, references)
   * from a parsed TEI XML structure.
   * @param teiData Parsed TEI XML object (from xml2js).
   * @returns A record containing the extracted section texts.
   */
  extractSectionsFromTei(teiData: ParsedTei): Record<string, string> {
    const sections: Record<string, string> = {};
    const tei: TeiRoot | undefined = teiData?.TEI;
    if (!tei) {
      this.logger.warn('TEI root element not found in parsed XML data.');
      return sections;
    }

    this.logger.log('Starting TEI section extraction.');
    try {
      const header: FileDesc | undefined = tei.teiHeader?.fileDesc;
      if (header?.titleStmt?.title?._) {
        sections['title'] = header.titleStmt.title._;
      }

      const authors: Author | Author[] | undefined = header?.titleStmt?.author;
      if (authors) {
        const authorArray = Array.isArray(authors) ? authors : [authors];
        const authorNames = authorArray
          .map((author) => this.extractAuthorName(author))
          .filter((name): name is string => name !== null && name.length > 0);
        if (authorNames.length > 0) {
          sections['authors'] = authorNames.join('; ');
        }
      }

      const abstractElement = header?.profileDesc?.abstract;
      if (abstractElement) {
        sections['abstract'] = this.extractTextFromElement(abstractElement);
      }

      const bodyElement = tei.text?.body;
      if (bodyElement) {
        sections['body'] = this.extractTextFromElement(bodyElement);
      }

      const refStructs = tei.text?.back?.div?.[0]?.listBibl?.biblStruct;
      if (refStructs) {
        const refStructArray = Array.isArray(refStructs) ? refStructs : [refStructs];
        sections['references'] = refStructArray
          .map((ref) => this.extractTextFromElement(ref))
          .join('\n\n');
      }

      this.logger.log(`Extracted sections: ${Object.keys(sections).join(', ')}`);
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      const errorStack = e instanceof Error ? e.stack : undefined;
      this.logger.error('Error during TEI section extraction', errorStack);
      throw new Error(`Failed during TEI section extraction: ${errorMessage}`);
    }

    return sections;
  }

  /**
   * Helper to extract a formatted author name from an author element.
   * Handles potential undefined properties safely.
   * @param author The author element from parsed TEI.
   * @returns Formatted author name or null if not found/parsable.
   */
  private extractAuthorName(author: Author): string | null {
    const persName = author?.persName;
    if (persName) {
      const firstName = persName.forename?._?.trim() || '';
      const surname = persName.surname?._?.trim() || '';
      const fullName = `${firstName} ${surname}`.trim();
      return fullName.length > 0 ? fullName : null;
    }
    return null;
  }

  /**
   * Recursively extracts and cleans text content from potentially nested TEI elements.
   * @param element A part of the parsed TEI XML structure (element, array, string, etc.).
   * @returns The concatenated and cleaned text content.
   */
  private extractTextFromElement(element: TeiElement | TeiElement[] | string | undefined | null): string {
    const parts = this.collectTextParts(element);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Recursively traverses a node (object, array, or string) and collects all non-empty text parts.
   * @param node The current node in the parsed XML structure. Can be an object (TeiElement),
   *             an array of nodes, a string, or null/undefined.
   * @returns An array of trimmed, non-empty text strings found within the node.
   */
  private collectTextParts(node: TeiElement | TeiElement[] | string | undefined | null): string[] {
    const parts: string[] = [];

    if (!node) {
      return parts;
    }

    if (Array.isArray(node)) {
      node.forEach(item => {
        parts.push(...this.collectTextParts(item));
      });
    } else if (typeof node === 'object') {
      if (node['_'] && typeof node['_'] === 'string') {
        const directText = node['_'].trim();
        if (directText) {
          parts.push(directText);
        }
      }
      for (const key in node) {
        if (key !== '$' && key !== '_') {
          if (Object.prototype.hasOwnProperty.call(node, key)) {
            parts.push(...this.collectTextParts(node[key]));
          }
        }
      }
    } else if (typeof node === 'string') {
      const trimmedText = node.trim();
      if (trimmedText) {
        parts.push(trimmedText);
      }
    }

    return parts;
  }
} 