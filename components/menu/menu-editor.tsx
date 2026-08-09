"use client";

import { useState, useTransition } from "react";

import {
  addCategory,
  addItem,
  deleteCategory,
  deleteItem,
  renameCategory,
  updateItem,
} from "@/app/actions/menu";
import { AvailabilityToggle } from "@/components/menu/availability-toggle";
import { PhotoButton } from "@/components/menu/photo-button";
import { SaveOnBlur } from "@/components/menu/save-on-blur";
import { formatFils } from "@/lib/domain/money";

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price_fils: number;
  is_available: boolean;
  photo_path: string | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  menu_items: MenuItem[];
};

export function MenuEditor({ categories }: { categories: MenuCategory[] }) {
  const [newCategory, setNewCategory] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-8">
      {categories.map((category) => (
        <section
          key={category.id}
          className="rounded-md border border-border-hairline bg-surface-raised"
        >
          <header className="flex items-center gap-2 border-b border-border-hairline px-3 py-2">
            <SaveOnBlur
              label="Section name"
              initialValue={category.name}
              className="text-heading font-semibold"
              onSave={(value) => renameCategory(category.id, value)}
            />
            <DeleteButton
              label="Delete section"
              confirmMessage={
                category.menu_items.length > 0
                  ? `Delete “${category.name}” and the ${category.menu_items.length} item${
                      category.menu_items.length === 1 ? "" : "s"
                    } in it?`
                  : `Delete “${category.name}”?`
              }
              onDelete={() => deleteCategory(category.id)}
            />
          </header>

          <ul>
            {category.menu_items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-start gap-3 border-b border-border-hairline px-3 py-3 last:border-b-0"
              >
                <PhotoButton
                  itemId={item.id}
                  name={item.name}
                  photoPath={item.photo_path}
                />

                <div className="min-w-[12rem] flex-1">
                  <SaveOnBlur
                    label="Dish name"
                    placeholder="Dish name"
                    initialValue={item.name}
                    className="font-semibold"
                    onSave={(value) => updateItem(item.id, { name: value })}
                  />
                  <SaveOnBlur
                    label="Description"
                    placeholder="Short description (optional)"
                    initialValue={item.description ?? ""}
                    multiline
                    className="text-meta text-ink-secondary"
                    onSave={(value) =>
                      updateItem(item.id, { description: value })
                    }
                  />
                </div>

                <div className="w-28">
                  <SaveOnBlur
                    label="Price in dirhams"
                    placeholder="0.00"
                    inputMode="decimal"
                    align="end"
                    className="tabular font-semibold"
                    initialValue={formatFils(item.price_fils)}
                    onSave={(value) => updateItem(item.id, { price: value })}
                  />
                </div>

                <AvailabilityToggle
                  itemId={item.id}
                  isAvailable={item.is_available}
                />

                <DeleteButton
                  label="Delete dish"
                  confirmMessage={`Delete “${item.name || "this dish"}”?`}
                  onDelete={() => deleteItem(item.id)}
                />
              </li>
            ))}
          </ul>

          <div className="px-3 py-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => addItem(category.id).then(() => {}))}
              className="min-h-touch rounded-md border border-border-strong bg-surface-raised px-5 text-body text-ink-primary disabled:opacity-60"
            >
              Add a dish
            </button>
          </div>
        </section>
      ))}

      <form
        className="flex flex-wrap items-center gap-2"
        action={() => {
          const name = newCategory;
          setNewCategory("");
          startTransition(() => addCategory(name).then(() => {}));
        }}
      >
        <label htmlFor="new-category" className="sr-only">
          New section name
        </label>
        <input
          id="new-category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New section, e.g. Grills"
          className="min-h-touch min-w-[14rem] flex-1 rounded-sm border border-border-strong bg-surface-raised px-4 text-body"
        />
        <button
          type="submit"
          disabled={pending || newCategory.trim().length === 0}
          className="min-h-touch rounded-md bg-accent px-6 text-body font-semibold text-white disabled:opacity-60"
        >
          Add section
        </button>
      </form>
    </div>
  );
}

/**
 * Confirmation is reserved for the destructive and permanent — everything else
 * on this screen is undo-able by simply typing again (EXPERIENCE.md
 * § Interaction Primitives).
 */
function DeleteButton({
  label,
  confirmMessage,
  onDelete,
}: {
  label: string;
  confirmMessage: string;
  onDelete: () => Promise<{ ok: boolean }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      aria-label={label}
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;
        startTransition(() => onDelete().then(() => {}));
      }}
      className="min-h-touch shrink-0 rounded-sm px-3 text-meta text-ink-secondary hover:text-status-problem disabled:opacity-60"
    >
      Delete
    </button>
  );
}
