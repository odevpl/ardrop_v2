import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "components/GlobalNotification/index.js";
import CategoriesService from "services/categories";
import "../../pages/categories/categories.scss";

const emptyForm = {
  id: null,
  name: "",
  slug: "",
  parentId: "",
  description: "",
  position: 0,
  isActive: true,
  seoTitle: "",
  seoDescription: "",
};

const CategoryForm = ({ id }) => {
  const navigate = useNavigate();
  const notification = useNotification();
  const [form, setForm] = useState(emptyForm);
  const [categories, setCategories] = useState([]);
  const [pendingImages, setPendingImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageBusy, setIsImageBusy] = useState(false);

  const isEdit = Boolean(id);

  const loadData = async () => {
    setIsLoading(true);
    const requests = [
      CategoriesService.getCategories({ page: 1, limit: 500, sortBy: "position", sortOrder: "asc" }),
    ];
    if (isEdit) {
      requests.unshift(CategoriesService.getCategoryById(id));
    }

    const responses = await Promise.all(requests);
    const categoriesResponse = responses[responses.length - 1];
    setCategories(Array.isArray(categoriesResponse?.data) ? categoriesResponse.data : []);

    if (isEdit) {
      const categoryResponse = responses[0];
      if (categoryResponse?.status && categoryResponse.status >= 400) {
        notification.error(categoryResponse?.data?.error || "Nie udalo sie pobrac kategorii.");
        setIsLoading(false);
        return;
      }

      const category = categoryResponse?.data || categoryResponse?.category;
      if (category) {
        setForm({
          id: category.id,
          name: category.name || "",
          slug: category.slug || "",
          parentId: category.parentId || "",
          description: category.description || "",
          position: category.position || 0,
          isActive: Boolean(category.isActive),
          seoTitle: category.seoTitle || "",
          seoDescription: category.seoDescription || "",
        });
        setExistingImages(Array.isArray(category.images) ? category.images : []);
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const parentOptions = useMemo(
    () => categories.filter((category) => Number(category.id) !== Number(id)),
    [categories, id],
  );

  const handleSave = async (event) => {
    event.preventDefault();
    setIsSaving(true);

    const payload = {
      ...form,
      parentId: form.parentId ? Number(form.parentId) : null,
      position: Number(form.position || 0),
      isActive: Boolean(form.isActive),
    };

    const response = isEdit
      ? await CategoriesService.updateCategory({ id, payload })
      : await CategoriesService.createCategory(payload);

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie zapisac kategorii.");
      setIsSaving(false);
      return;
    }

    const category = response?.data || response?.category;
    const categoryId = Number(category?.id);

    for (const file of pendingImages) {
      const uploadResponse = await CategoriesService.uploadCategoryImage({ categoryId, file });
      if (uploadResponse?.status && uploadResponse.status >= 400) {
        notification.error(uploadResponse?.data?.error || "Nie udalo sie przeslac obrazu kategorii.");
        setIsSaving(false);
        return;
      }
    }

    notification.success(isEdit ? "Kategoria zostala zaktualizowana." : "Kategoria zostala dodana.");
    setPendingImages([]);
    setIsSaving(false);
    navigate(`/categories/${categoryId}`);
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    const confirmed = window.confirm("Czy na pewno chcesz usunac te kategorie?");
    if (!confirmed) return;

    const response = await CategoriesService.deleteCategory(id);
    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie usunac kategorii.");
      return;
    }

    notification.success("Kategoria zostala usunieta.");
    navigate("/categories");
  };

  const handleDeleteImage = async (image) => {
    setIsImageBusy(true);
    const response = await CategoriesService.deleteCategoryImage({
      categoryId: id,
      fileName: image.fileName,
    });

    if (response?.status && response.status >= 400) {
      notification.error(response?.data?.error || "Nie udalo sie usunac obrazu kategorii.");
      setIsImageBusy(false);
      return;
    }

    await loadData();
    setIsImageBusy(false);
  };

  if (isLoading) {
    return <section className="adminPageSection">Ladowanie...</section>;
  }

  return (
    <section className="adminPageSection adminCategoriesPage">
      <div className="adminToolbar">
        <h2>{isEdit ? "Edytuj kategorie" : "Dodaj kategorie"}</h2>
      </div>

      <form className="adminCategoriesEditor" onSubmit={handleSave}>
        <div className="adminCategoriesEditorLayout">
          <aside className="adminCategoriesImages">
            <div className="adminToolbar">
              <h3>Obraz kategorii</h3>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setPendingImages(Array.from(event.target.files || []))}
              disabled={isSaving}
            />
            {pendingImages.length > 0 ? (
              <p className="adminFormError">Nowy plik do wyslania: {pendingImages.map((file) => file.name).join(", ")}. Po zapisie zastapi obecny obraz.</p>
            ) : null}

            {isEdit ? (
              <div className="adminCategoriesImageGrid">
                {existingImages.map((image) => (
                  <article key={image.id} className="adminCategoriesImageCard">
                    <div className="adminCategoriesImagePreview">
                      <img src={image.thumbUrl || image.url} alt={form.name || "Obraz kategorii"} />
                    </div>
                    <div className="adminCategoriesImageActions">
                      <button
                        type="button"
                        className="adminCategoriesImageAction adminCategoriesImageActionDanger"
                        onClick={() => handleDeleteImage(image)}
                        disabled={isImageBusy}
                      >
                        Usun
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </aside>

          <div className="adminCategoriesFormPanel">
            <div className="adminCategoriesFieldGrid">
              <label>
                <span>Nazwa</span>
                <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} />
              </label>
              <label>
                <span>Slug</span>
                <input value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
              </label>
              <label>
                <span>Rodzic</span>
                <select
                  value={form.parentId}
                  onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
                >
                  <option value="">Brak</option>
                  {parentOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Pozycja</span>
                <input
                  type="number"
                  value={form.position}
                  onChange={(event) => setForm((prev) => ({ ...prev, position: event.target.value }))}
                />
              </label>
              <label className="adminCategoriesCheckbox">
                <input
                  type="checkbox"
                  checked={Boolean(form.isActive)}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                <span>Aktywna</span>
              </label>
            </div>

            <label>
              <span>Opis</span>
              <textarea
                rows={4}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </label>

            <div className="adminCategoriesFieldGrid">
              <label>
                <span>SEO title</span>
                <input
                  value={form.seoTitle}
                  onChange={(event) => setForm((prev) => ({ ...prev, seoTitle: event.target.value }))}
                />
              </label>
              <label>
                <span>SEO description</span>
                <input
                  value={form.seoDescription}
                  onChange={(event) => setForm((prev) => ({ ...prev, seoDescription: event.target.value }))}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="adminActions adminFormActions">
          <button type="submit" className="adminPrimaryButton" disabled={isSaving}>
            {isSaving ? "Zapisywanie..." : "Zapisz"}
          </button>
          {isEdit ? (
            <button type="button" onClick={handleDelete} disabled={isSaving}>
              Usun
            </button>
          ) : null}
          <button type="button" onClick={() => navigate("/categories")} disabled={isSaving}>
            Anuluj
          </button>
        </div>
      </form>
    </section>
  );
};

export default CategoryForm;
