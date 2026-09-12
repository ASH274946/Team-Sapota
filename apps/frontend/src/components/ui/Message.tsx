'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Edit2,
  Sparkles,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface MessageProps {
  children: React.ReactNode;
  from: 'user' | 'assistant';
  className?: string;
}

export function Message({
  children,
  from,
  className = '',
}: MessageProps) {
  const isUser = from === 'user';

  return (
    <div
      className={`flex w-full gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export interface MessageAvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  isAssistant?: boolean;
  className?: string;
}

export function MessageAvatar({
  src,
  alt = '',
  fallback,
  isAssistant = false,
  className = '',
}: MessageAvatarProps) {
  return (
    <div
      className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-2xs border ${
        isAssistant
          ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white border-orange-400/40'
          : 'bg-neutral-100 text-neutral-800 border-neutral-200'
      } ${className}`}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full rounded-xl object-cover" />
      ) : isAssistant ? (
        <Sparkles className="w-4 h-4" />
      ) : (
        fallback || <User className="w-4 h-4" />
      )}
    </div>
  );
}

export function MessageStack({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[75%] ${className}`}>
      {children}
    </div>
  );
}

export interface MessageContentProps {
  children: React.ReactNode;
  from?: 'user' | 'assistant';
  className?: string;
}

export function MessageContent({
  children,
  from,
  className = '',
}: MessageContentProps) {
  const isUser = from === 'user';

  return (
    <div
      className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-xs ${
        isUser
          ? 'bg-[#e05934] text-white rounded-br-xs'
          : 'bg-white text-neutral-900 border border-neutral-200/80 rounded-bl-xs'
      } ${className}`}
    >
      {children}
    </div>
  );
}

function parseInline(text: string): React.ReactNode {
  if (!text) return null;

  // Match bold-italic (***text***), bold (**text** or __text__), italic (*text* or _text_), inline code (`code`), links ([text](url))
  const tokenRegex = /(\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, index) => {
    if (!part) return null;

    // Bold-italic (***text*** or ___text___)
    if (
      (part.startsWith('***') && part.endsWith('***') && part.length >= 6) ||
      (part.startsWith('___') && part.endsWith('___') && part.length >= 6)
    ) {
      return (
        <strong key={index} className="font-bold italic text-inherit">
          {parseInline(part.slice(3, -3))}
        </strong>
      );
    }

    // Bold (**text** or __text__)
    if (
      (part.startsWith('**') && part.endsWith('**') && part.length >= 4) ||
      (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
    ) {
      return (
        <strong key={index} className="font-bold text-inherit">
          {parseInline(part.slice(2, -2))}
        </strong>
      );
    }

    // Italic (*text* or _text_)
    if (
      (part.startsWith('*') && part.endsWith('*') && part.length >= 2) ||
      (part.startsWith('_') && part.endsWith('_') && part.length >= 2)
    ) {
      return (
        <em key={index} className="italic text-inherit opacity-95">
          {parseInline(part.slice(1, -1))}
        </em>
      );
    }

    // Inline code (`code`)
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-black/5 text-inherit font-mono text-[0.88em] border border-black/10"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Links [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-600 hover:text-orange-700 underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return part;
  });
}

function parseMarkdownBlocks(content: string): React.ReactNode[] {
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks ```
    if (line.trim().startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={`code-${elements.length}`}
          className="my-2.5 p-3.5 rounded-xl bg-neutral-900 text-neutral-100 font-mono text-xs overflow-x-auto border border-neutral-800 leading-normal"
        >
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Horizontal Rule (--- or *** or ___)
    if (/^\s*(\-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      elements.push(
        <hr key={`hr-${elements.length}`} className="my-4 border-t border-neutral-200/90" />
      );
      i++;
      continue;
    }

    // Headings (#, ##, ###)
    if (/^#{1,6}\s+/.test(line)) {
      const level = line.match(/^(#{1,6})\s+/)?.[1].length || 1;
      const text = line.replace(/^#{1,6}\s+/, '');
      if (level === 1) {
        elements.push(
          <h1 key={`h1-${elements.length}`} className="text-base sm:text-lg font-bold text-neutral-900 mt-3 mb-1.5">
            {parseInline(text)}
          </h1>
        );
      } else if (level === 2) {
        elements.push(
          <h2 key={`h2-${elements.length}`} className="text-sm sm:text-base font-bold text-neutral-900 mt-2.5 mb-1.5">
            {parseInline(text)}
          </h2>
        );
      } else {
        elements.push(
          <h3 key={`h3-${elements.length}`} className="text-xs sm:text-sm font-bold text-neutral-900 mt-2 mb-1">
            {parseInline(text)}
          </h3>
        );
      }
      i++;
      continue;
    }

    // Blockquote (> )
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="my-2 border-l-2 border-orange-400 pl-3 py-1 text-neutral-600 italic bg-orange-50/30 rounded-r-lg"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx}>{parseInline(ql)}</p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Ordered lists (1. , 2. , etc.)
    if (/^\s*\d+\.\s+/.test(line)) {
      const listItems: { num: string; content: string }[] = [];
      while (i < lines.length && /^\s*(\d+)\.\s+(.*)/.test(lines[i])) {
        const match = lines[i].match(/^\s*(\d+)\.\s+(.*)/);
        if (match) {
          listItems.push({ num: match[1], content: match[2] });
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm">
              <span className="font-bold text-neutral-600 shrink-0 select-none">{item.num}.</span>
              <div className="flex-1 leading-relaxed">{parseInline(item.content)}</div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered lists (- , * , • )
    if (/^\s*[\-\*\•]\s+/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\s*[\-\*\•]\s+(.*)/.test(lines[i])) {
        const match = lines[i].match(/^\s*[\-\*\•]\s+(.*)/);
        if (match) {
          listItems.push(match[1]);
        }
        i++;
      }
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {listItems.map((item, lIdx) => (
            <li key={lIdx} className="flex items-start gap-2 text-xs sm:text-sm">
              <span className="text-orange-500 font-bold shrink-0 mt-0.5 leading-none select-none">•</span>
              <div className="flex-1 leading-relaxed">{parseInline(item)}</div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      i++;
      continue;
    }

    // Paragraph: collect lines until an empty line, list, heading, hr, or blockquote
    const pLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('```') &&
      !/^\s*(\-{3,}|\*{3,}|_{3,})\s*$/.test(lines[i]) &&
      !/^#{1,6}\s+/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*[\-\*\•]\s+/.test(lines[i])
    ) {
      pLines.push(lines[i]);
      i++;
    }

    if (pLines.length > 0) {
      elements.push(
        <p key={`p-${elements.length}`} className="my-1.5 leading-relaxed text-xs sm:text-sm">
          {pLines.map((pl, plIdx) => (
            <React.Fragment key={plIdx}>
              {parseInline(pl)}
              {plIdx < pLines.length - 1 && <br />}
            </React.Fragment>
          ))}
        </p>
      );
    }
  }

  return elements;
}

export function MessageMarkdown({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  if (typeof children !== 'string') {
    return <div className={`space-y-2 ${className}`}>{children}</div>;
  }

  return (
    <div className={`font-sans leading-relaxed space-y-2.5 ${className}`}>
      {parseMarkdownBlocks(children)}
    </div>
  );
}

export function MessageActions({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-1 mt-0.5 px-1 ${className}`}>
      {children}
    </div>
  );
}

export function MessageActionGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`flex items-center gap-0.5 ${className}`}>{children}</div>;
}

export interface MessageActionProps {
  children?: React.ReactNode;
  tooltip?: string | { content: string; shortcut?: string; side?: string };
  onClick?: () => void;
  icon?: 'copy' | 'like' | 'dislike' | 'regenerate' | 'edit';
  className?: string;
  active?: boolean;
}

export function MessageAction({
  children,
  tooltip,
  onClick,
  icon,
  className = '',
  active = false,
}: MessageActionProps) {
  const [copied, setCopied] = useState(false);

  const title =
    typeof tooltip === 'object' && tooltip !== null
      ? `${tooltip.content}${tooltip.shortcut ? ` (${tooltip.shortcut})` : ''}`
      : tooltip || '';

  const handleClick = () => {
    if (icon === 'copy') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Copied to clipboard');
    }
    onClick?.();
  };

  const renderIcon = () => {
    if (icon === 'copy') {
      return copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      );
    }
    if (icon === 'like') return <ThumbsUp className="w-3.5 h-3.5" />;
    if (icon === 'dislike') return <ThumbsDown className="w-3.5 h-3.5" />;
    if (icon === 'regenerate') return <RotateCcw className="w-3.5 h-3.5" />;
    if (icon === 'edit') return <Edit2 className="w-3.5 h-3.5" />;
    return children;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title}
      className={`p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer active:scale-95 ${
        active ? 'text-[#e05934] bg-orange-50' : ''
      } ${className}`}
    >
      {renderIcon()}
    </button>
  );
}
