const LIST_TYPES = {
  bulletListItem: "bullet",
  numberedListItem: "numbered",
  checkListItem: "check",
};

const SAFE_LINK_PROTOCOLS = ["http", "https", "mailto", "tel"];

function schemeOf(value) {
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(value);
  return match ? match[1].toLowerCase() : "";
}

/**
 * Chặn `javascript:` và `data:` trước khi giá trị chạm tới thuộc tính src/href.
 * Đường dẫn tương đối không có scheme nên được cho qua.
 */
export function resolveImageSrc(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const scheme = schemeOf(raw);
  if (!scheme) return raw;
  return scheme === "http" || scheme === "https" ? raw : "";
}

export function resolveLinkHref(url) {
  const raw = String(url ?? "").trim();
  if (!raw) return "";

  const scheme = schemeOf(raw);
  if (!scheme) return raw;
  return SAFE_LINK_PROTOCOLS.includes(scheme) ? raw : "";
}

export function isTableContent(content) {
  return (
    Boolean(content) &&
    typeof content === "object" &&
    !Array.isArray(content) &&
    Array.isArray(content.rows)
  );
}

/**
 * Chuyển inline content của BlockNote thành danh sách đoạn chữ phẳng.
 * Chấp nhận cả chuỗi thuần vì `deserializeRichTextContent` sinh ra block
 * dạng `{ type: "paragraph", content: "..." }` khi nâng cấp nội dung cũ.
 */
export function toInlineSegments(content) {
  if (content == null) return [];

  if (typeof content === "string") {
    return content ? [{ text: content, styles: {}, href: "" }] : [];
  }

  if (!Array.isArray(content)) return [];

  const segments = [];

  for (const node of content) {
    if (typeof node === "string") {
      if (node) segments.push({ text: node, styles: {}, href: "" });
      continue;
    }

    if (!node || typeof node !== "object") continue;

    if (node.type === "link") {
      const href = resolveLinkHref(node.href);
      for (const child of toInlineSegments(node.content)) {
        segments.push({ ...child, href });
      }
      continue;
    }

    const text = typeof node.text === "string" ? node.text : "";
    if (!text) continue;

    segments.push({
      text,
      styles: node.styles && typeof node.styles === "object" ? node.styles : {},
      href: "",
    });
  }

  return segments;
}

export function toTableRows(content) {
  if (!isTableContent(content)) return [];

  return content.rows.map((row) => {
    const cells = Array.isArray(row?.cells) ? row.cells : [];
    return cells.map((cell) => {
      const cellContent =
        cell && typeof cell === "object" && !Array.isArray(cell) && "content" in cell
          ? cell.content
          : cell;
      return toInlineSegments(cellContent);
    });
  });
}

export function segmentsToText(segments) {
  return segments.map((segment) => segment.text).join("");
}

export function blockToPlainText(block) {
  if (!block || typeof block !== "object") return "";

  if (block.type === "image") {
    return String(block.props?.caption ?? "").trim();
  }

  if (isTableContent(block.content)) {
    return toTableRows(block.content)
      .map((row) => row.map(segmentsToText).join("\t"))
      .join("\n");
  }

  return segmentsToText(toInlineSegments(block.content));
}

export function blocksToPlainText(blocks) {
  const lines = [];

  const walk = (list) => {
    if (!Array.isArray(list)) return;

    for (const block of list) {
      if (!block || typeof block !== "object") continue;
      const text = blockToPlainText(block);
      if (text) lines.push(text);
      walk(block.children);
    }
  };

  walk(blocks);

  return lines.join("\n");
}

/**
 * BlockNote lưu mỗi mục danh sách thành một block riêng lẻ. Gom các mục liền
 * kề cùng loại lại để render được thành một thẻ `ul`/`ol` duy nhất.
 */
export function groupBlocks(blocks) {
  const groups = [];
  const list = Array.isArray(blocks) ? blocks : [];

  for (const block of list) {
    if (!block || typeof block !== "object") continue;

    const listType = LIST_TYPES[block.type];

    if (!listType) {
      groups.push({ kind: "block", block });
      continue;
    }

    const previous = groups[groups.length - 1];

    if (previous && previous.kind === "list" && previous.listType === listType) {
      previous.items.push(block);
    } else {
      groups.push({ kind: "list", listType, items: [block] });
    }
  }

  return groups;
}
