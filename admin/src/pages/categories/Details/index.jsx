import { useParams } from "react-router-dom";
import CategoryForm from "modules/CategoryForm";

const CategoryDetailsPage = () => {
  const { id } = useParams();
  const parsedId = Number(id);
  const isInvalidId = Number.isNaN(parsedId) || parsedId <= 0;

  if (isInvalidId) {
    return <section className="adminPageSection">Nieprawidlowe ID kategorii.</section>;
  }

  return <CategoryForm id={parsedId} />;
};

export default CategoryDetailsPage;
