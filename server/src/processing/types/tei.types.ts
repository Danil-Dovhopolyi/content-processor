export interface TeiElement {
  _?: string;
  [key: string]: any;
}

export interface PersName extends TeiElement {
  forename?: TeiElement;
  surname?: TeiElement;
}

export interface Author extends TeiElement {
  persName?: PersName;
}

export interface TitleStmt extends TeiElement {
  title?: TeiElement;
  author?: Author | Author[];
}

export interface Abstract extends TeiElement {
  p?: TeiElement | TeiElement[];
}

export interface ProfileDesc extends TeiElement {
  abstract?: Abstract;
}

export interface FileDesc extends TeiElement {
  titleStmt?: TitleStmt;
  profileDesc?: ProfileDesc;
}

export interface TeiHeader extends TeiElement {
  fileDesc?: FileDesc;
}

export interface Div extends TeiElement {
}

export interface BiblStruct extends TeiElement {
}

export interface ListBibl extends TeiElement {
  biblStruct?: BiblStruct | BiblStruct[];
}

export interface Back extends TeiElement {
  div?: Div | Div[];
}

export interface Body extends TeiElement {
  div?: Div | Div[];
}

export interface Text extends TeiElement {
  body?: Body;
  back?: Back;
}

export interface TeiRoot extends TeiElement {
  teiHeader?: TeiHeader;
  text?: Text;
}

export interface ParsedTei {
  TEI?: TeiRoot;
} 