import { Fragment } from "react";
import {
  blockToPlainText,
  groupBlocks,
  isTableContent,
  resolveImageSrc,
  toInlineSegments,
  toTableRows,
} from "./richTextBlocks";
import {
  FORMAT_BLOCKNOTE,
  normalizeContentFormat,
  parseRichTextContent,
  splitPlainParagraphs,
} from "./richTextUtils";
import "./richtext.css";

function styleFromProps(props) {
  const style = {};
  if (props?.textColor && props.textColor !== "default") style.color = props.textColor;
  if (props?.backgroundColor && props.backgroundColor !== "default") {
    style.backgroundColor = props.backgroundColor;
  }
  if (props?.textAlignment && props.textAlignment !== "left") {
    style.textAlign = props.textAlignment;
  }
  return Object.keys(style).length ? style : undefined;
}

function Segments({ segments }) {
  return segments.map((segment, index) => {
    const { text, styles = {}, href } = segment;

    let node = text;
    if (styles.code) node = <code className="rich-text__code">{node}</code>;
    if (styles.bold) node = <strong>{node}</strong>;
    if (styles.italic) node = <em>{node}</em>;
    if (styles.underline) node = <u>{node}</u>;
    if (styles.strike) node = <s>{node}</s>;

    const inlineStyle = styleFromProps(styles);
    if (inlineStyle) node = <span style={inlineStyle}>{node}</span>;

    if (href) {
      node = (
        <a href={href} target="_blank" rel="noreferrer noopener">
          {node}
        </a>
      );
    }

    return <Fragment key={index}>{node}</Fragment>;
  });
}

function BlockImage({ block }) {
  const src = resolveImageSrc(block.props?.url);
  const caption = String(block.props?.caption ?? "").trim();

  if (!src) return caption ? <p className="rich-text__caption">{caption}</p> : null;

  return (
    <figure className="rich-text__figure">
      <img src={src} alt={caption} loading="lazy" />
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}

function BlockTable({ block }) {
  const rows = toTableRows(block.content);
  if (!rows.length) return null;

  return (
    <div className="rich-text__table-wrap">
      <table className="rich-text__table">
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr key={rowIndex}>
              {cells.map((segments, cellIndex) => (
                <td key={cellIndex}>
                  <Segments segments={segments} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BlockChildren({ block }) {
  if (!Array.isArray(block.children) || !block.children.length) return null;
  return (
    <div className="rich-text__children">
      <BlockGroups blocks={block.children} />
    </div>
  );
}

function Block({ block }) {
  const segments = toInlineSegments(block.content);
  const style = styleFromProps(block.props);

  if (block.type === "image") {
    return (
      <>
        <BlockImage block={block} />
        <BlockChildren block={block} />
      </>
    );
  }

  if (block.type === "codeBlock") {
    const language = String(block.props?.language ?? "").trim();
    return (
      <pre className="rich-text__pre">
        <code className={language ? `language-${language}` : undefined}>
          {blockToPlainText(block)}
        </code>
      </pre>
    );
  }

  if (block.type === "table" || isTableContent(block.content)) {
    return (
      <>
        <BlockTable block={block} />
        <BlockChildren block={block} />
      </>
    );
  }

  if (block.type === "heading") {
    const level = Math.min(Math.max(Number(block.props?.level) || 1, 1), 3);
    const Heading = `h${level + 1}`;
    return (
      <>
        <Heading style={style}>
          <Segments segments={segments} />
        </Heading>
        <BlockChildren block={block} />
      </>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="rich-text__quote" style={style}>
        <Segments segments={segments} />
        <BlockChildren block={block} />
      </blockquote>
    );
  }

  return (
    <>
      <p style={style}>
        <Segments segments={segments} />
      </p>
      <BlockChildren block={block} />
    </>
  );
}

function ListGroup({ listType, items }) {
  const ListTag = listType === "numbered" ? "ol" : "ul";
  const className =
    listType === "check" ? "rich-text__list rich-text__list--check" : "rich-text__list";

  return (
    <ListTag className={className}>
      {items.map((item, index) => (
        <li key={item.id ?? index} style={styleFromProps(item.props)}>
          {listType === "check" && (
            <input type="checkbox" checked={Boolean(item.props?.checked)} readOnly />
          )}
          <span>
            <Segments segments={toInlineSegments(item.content)} />
          </span>
          <BlockChildren block={item} />
        </li>
      ))}
    </ListTag>
  );
}

function BlockGroups({ blocks }) {
  return groupBlocks(blocks).map((group, index) =>
    group.kind === "list" ? (
      <ListGroup key={index} listType={group.listType} items={group.items} />
    ) : (
      <Block key={group.block.id ?? index} block={group.block} />
    ),
  );
}

function InlineBlocks({ blocks }) {
  return blocks.map((block, index) => {
    if (!block || typeof block !== "object") return null;

    if (block.type === "image") {
      const src = resolveImageSrc(block.props?.url);
      if (!src) return null;
      return (
        <img
          key={block.id ?? index}
          className="rich-text__inline-image"
          src={src}
          alt={String(block.props?.caption ?? "")}
          loading="lazy"
        />
      );
    }

    const segments = toInlineSegments(block.content);
    if (!segments.length) return null;

    return (
      <Fragment key={block.id ?? index}>
        {index > 0 && " "}
        <Segments segments={segments} />
      </Fragment>
    );
  });
}

/**
 * Hiển thị nội dung rich text mà không dựng trình soạn thảo BlockNote.
 *
 * Trang làm bài và bảng ngân hàng câu hỏi render rất nhiều nội dung cùng lúc;
 * mỗi `BlockNoteView` là một instance ProseMirror nên cách đó không dùng được
 * ở quy mô này. Renderer dựng thẳng React element, đồng thời tránh luôn
 * `dangerouslySetInnerHTML` nên không mở ra bề mặt XSS.
 *
 * `variant="inline"` render bằng thẻ `span` để nhúng được vào những chỗ mà
 * HTML không cho phép thẻ khối, ví dụ nhãn của đáp án.
 */
export default function RichTextView({
  content,
  contentFormat = "plain",
  className = "",
  variant = "block",
}) {
  const format = normalizeContentFormat(contentFormat);
  const inline = variant === "inline";

  const blocks =
    format === FORMAT_BLOCKNOTE
      ? parseRichTextContent(content)
      : splitPlainParagraphs(content).map((paragraph) => ({
          type: "paragraph",
          content: paragraph,
        }));

  if (!blocks.length) return null;

  const classes = ["rich-text", inline ? "rich-text--inline" : "", className]
    .filter(Boolean)
    .join(" ");

  if (inline) {
    return (
      <span className={classes}>
        <InlineBlocks blocks={blocks} />
      </span>
    );
  }

  return (
    <div className={classes}>
      <BlockGroups blocks={blocks} />
    </div>
  );
}
