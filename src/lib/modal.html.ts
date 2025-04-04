interface ModalProps {
  body?: string;
  content?: string;
  footer?: string;
  id: string;
  title: string;
  size?: "default" | "modal-sm" | "modal-lg" | "modal-xl";
  form?: boolean;
  formEncType?: string;
  formMethod?: string;
  formAction?: string;
  formClass?: string;
}

export function Modal({
  body,
  content,
  footer,
  id,
  title,
  size = "modal-lg",
  form = true,
  formEncType,
  formMethod = "POST",
  formAction,
  formClass,
}: ModalProps): string {
  const titleId = `${id}-title`;
  const modal = `
    <div class="modal fade" tabindex="-1" role="dialog" id="${id}" aria-labelledby="${titleId}">
      <div class="modal-dialog ${
        size === "default" ? "" : size
      }" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title h4" id="${titleId}">${title}</h2>
          </div>
          ${
            body ? `<div class="modal-body" id="modal-body">${body}</div>` : ""
          } ${content ? content : ""}
          ${footer ? `<div class="modal-footer">${footer}</div>` : ""}
        </div>
      </div>
    </div>
  `;
  if (!form) return modal;

  return `
    <form
      method="${formMethod}"
      autocomplete="off"
      ${formEncType ? `enctype="${formEncType}"` : ""}
      ${formAction ? `action="${formAction}"` : ""}
      ${formClass ? `class="${formClass}"` : ""}
    >
      ${modal}
    </form>
  `;
}
