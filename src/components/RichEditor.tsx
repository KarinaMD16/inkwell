"use client";

import { mergeAttributes, Node } from "@tiptap/core";
import TextAlign from "@tiptap/extension-text-align";
import { Placeholder } from "@tiptap/extensions";
import { NodeViewWrapper, ReactNodeViewRenderer, useEditor, useEditorState, type Editor, type NodeViewProps } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Align, Block } from "@/lib/data";
import { blocksFromDoc, docFromBlocks, type Template } from "@/lib/richtext";
import { Icon, type IconName } from "./Icon";

export const TEMPLATES: { type: Template; label: string; hint: string; icon: IconName; placeholder: string }[] = [
  { type: "chat", label: "Chat", hint: "Mensajes entre personajes", icon: "chat", placeholder: "Un mensaje por línea, así:\nLau: ¿Alguien más lo escuchó?" },
  { type: "post", label: "Post de red social", hint: "Publicación con respuestas", icon: "at", placeholder: "@usuario: texto de la publicación" },
  { type: "ficha", label: "Ficha de personaje", hint: "Faceclaim, datos y descripción", icon: "idcard", placeholder: "Descripción del personaje" },
  { type: "interludio", label: "Interludio", hint: "Una pausa con su propio formato", icon: "dash", placeholder: "Texto del interludio" },
];

/** Una plantilla dentro del texto: una tarjeta con sus propios campos, que se mueve y se borra entera. */
function TemplateCard({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const tpl = TEMPLATES.find((t) => t.type === node.attrs.kind) ?? TEMPLATES[0];
  return (
    <NodeViewWrapper className={`eblock eblock--${tpl.type}`} contentEditable={false}>
      <div className="row between">
        <span className="eblock__label"><Icon name={tpl.icon} size={18} />{tpl.label}</span>
        <button type="button" className="linkbtn" onClick={deleteNode}>Quitar</button>
      </div>
      {tpl.type === "ficha" && (
        <input className="eblock__name" value={node.attrs.name} onChange={(e) => updateAttributes({ name: e.target.value })} placeholder="Nombre del personaje" aria-label="Nombre del personaje" />
      )}
      <textarea spellCheck lang="es" rows={4} value={node.attrs.text} placeholder={tpl.placeholder} aria-label={tpl.label} onChange={(e) => updateAttributes({ text: e.target.value })} />
    </NodeViewWrapper>
  );
}

const TemplateNode = Node.create({
  name: "plantilla",
  group: "block",
  atom: true,
  addAttributes() {
    return { kind: { default: "chat" }, name: { default: "" }, text: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-plantilla]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-plantilla": "" })];
  },
  addNodeView() {
    return ReactNodeViewRenderer(TemplateCard);
  },
});

/**
 * El editor de un capítulo: una sola hoja donde se escribe de corrido, como en Word.
 * Solo existe el formato que el lector sabe mostrar (negrita, cursiva, subrayado y alineación);
 * lo demás que llegue al pegar (títulos, listas, colores) se convierte en párrafos normales.
 */
export function useChapterEditor(initial: Block[], onChange: (blocks: Block[]) => void) {
  return useEditor({
    // La página se arma en el navegador; así el servidor no intenta pintar el editor.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false, blockquote: false, bulletList: false, orderedList: false, listItem: false, listKeymap: false,
        code: false, codeBlock: false, horizontalRule: false, strike: false, link: false,
      }),
      TextAlign.configure({ types: ["paragraph"] }),
      Placeholder.configure({ placeholder: "Empieza a escribir…" }),
      TemplateNode,
    ],
    content: docFromBlocks(initial),
    editorProps: { attributes: { class: "rich", spellcheck: "true", lang: "es", role: "textbox", "aria-multiline": "true", "aria-label": "Texto del capítulo" } },
    onUpdate: ({ editor }) => onChange(blocksFromDoc(editor.getJSON())),
  });
}

/** Inserta una plantilla donde está el cursor y deja un párrafo después para seguir escribiendo. */
export function insertTemplate(editor: Editor, kind: Template) {
  editor.chain().focus().insertContent([{ type: "plantilla", attrs: { kind } }, { type: "paragraph" }]).run();
}

const ALIGN: { value: Align; label: string; icon: IconName }[] = [
  { value: "left", label: "Alinear a la izquierda", icon: "alignleft" },
  { value: "center", label: "Centrar", icon: "aligncenter" },
  { value: "right", label: "Alinear a la derecha", icon: "alignright" },
  { value: "justify", label: "Justificar", icon: "alignjustify" },
];

/** Barra de formato. Las letras son las de Word en español: N de negrita, K de cursiva, S de subrayado. */
export function FormatBar({ editor }: { editor: Editor | null }) {
  const on = useEditorState({
    editor,
    selector: ({ editor: e }) => e && {
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"),
      align: ALIGN.find((a) => a.value !== "left" && e.isActive({ textAlign: a.value }))?.value ?? "left",
      undo: e.can().undo(), redo: e.can().redo(),
    },
  });
  const off = !editor || !on;
  return (
    <div className="formatbar" role="toolbar" aria-label="Formato del texto">
      <div className="formatbar__group">
        <button type="button" className="formatbar__btn" aria-label="Negrita (Ctrl+B)" title="Negrita (Ctrl+B)" aria-pressed={on?.bold ?? false} disabled={off} onClick={() => editor?.chain().focus().toggleBold().run()}><b>N</b></button>
        <button type="button" className="formatbar__btn" aria-label="Cursiva (Ctrl+I)" title="Cursiva (Ctrl+I)" aria-pressed={on?.italic ?? false} disabled={off} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>K</i></button>
        <button type="button" className="formatbar__btn" aria-label="Subrayado (Ctrl+U)" title="Subrayado (Ctrl+U)" aria-pressed={on?.underline ?? false} disabled={off} onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>S</u></button>
      </div>
      <div className="formatbar__group">
        {ALIGN.map((a) => (
          <button key={a.value} type="button" className="formatbar__btn" aria-label={a.label} title={a.label} aria-pressed={on?.align === a.value} disabled={off} onClick={() => editor?.chain().focus().setTextAlign(a.value).run()}>
            <Icon name={a.icon} size={20} stroke={2} />
          </button>
        ))}
      </div>
      <div className="formatbar__group">
        <button type="button" className="formatbar__btn" aria-label="Deshacer (Ctrl+Z)" title="Deshacer (Ctrl+Z)" disabled={off || !on.undo} onClick={() => editor?.chain().focus().undo().run()}><Icon name="undo" size={20} stroke={2} /></button>
        <button type="button" className="formatbar__btn" aria-label="Rehacer (Ctrl+Y)" title="Rehacer (Ctrl+Y)" disabled={off || !on.redo} onClick={() => editor?.chain().focus().redo().run()}><Icon name="redo" size={20} stroke={2} /></button>
      </div>
    </div>
  );
}
