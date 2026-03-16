import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import CategoriesService from 'services/categories'
import './sidebar-menu.scss'

const sortNodes = (nodes = []) =>
  [...nodes].sort((left, right) => {
    if (Number(left.position || 0) !== Number(right.position || 0)) {
      return Number(left.position || 0) - Number(right.position || 0)
    }
    return String(left.name || '').localeCompare(String(right.name || ''), 'pl')
  })

const collectExpandedAncestors = (nodes = [], activeCategory, ancestors = []) =>
  nodes.reduce((acc, category) => {
    const categoryKey = String(category.slug || category.name || '')
    const nextAncestors = [...ancestors, Number(category.id)]

    if (categoryKey === activeCategory) {
      nextAncestors.slice(0, -1).forEach((id) => acc.add(id))
    }

    if (Array.isArray(category.children) && category.children.length > 0) {
      const childMatches = collectExpandedAncestors(category.children, activeCategory, nextAncestors)
      childMatches.forEach((id) => acc.add(id))
    }

    return acc
  }, new Set())

const CategoryBranch = ({ nodes, activeCategory, expandedIds, onSelect, onToggleExpand }) => (
  <ol className="sidebarMenuCategoriesList">
    {sortNodes(nodes).map((category) => {
      const categoryKey = String(category.slug || category.name || '')
      const isActive = activeCategory === categoryKey
      const hasChildren = Array.isArray(category.children) && category.children.length > 0
      const isExpanded = expandedIds.has(Number(category.id))

      return (
        <li key={category.id} className="sidebarMenuCategoriesItem">
          <div className="sidebarMenuCategoryRow">
            <button
              type="button"
              className={`sidebarMenuCategoryButton${isActive ? ' sidebarMenuCategoryButtonActive' : ''}`}
              onClick={() => onSelect(categoryKey)}
            >
              <span>{category.name}</span>
            </button>
            {hasChildren ? (
              <button
                type="button"
                className={`sidebarMenuCategoryToggle${isExpanded ? ' sidebarMenuCategoryToggleExpanded' : ''}`}
                onClick={() => onToggleExpand(Number(category.id))}
                aria-label={isExpanded ? `Zwin podkategorie ${category.name}` : `Rozwin podkategorie ${category.name}`}
                aria-expanded={isExpanded}
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          {hasChildren && isExpanded ? (
            <CategoryBranch
              nodes={category.children}
              activeCategory={activeCategory}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
            />
          ) : null}
        </li>
      )
    })}
  </ol>
)

const SidebarMenu = ({ config }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [expandedIds, setExpandedIds] = useState(new Set())

  useEffect(() => {
    const loadCategories = async () => {
      const response = await CategoriesService.getCategories({
        page: 1,
        limit: 500,
        sortBy: 'position',
        sortOrder: 'asc',
        activeOnly: 1,
        view: 'tree',
      })
      setCategories(Array.isArray(response?.data) ? response.data : [])
    }

    loadCategories()
  }, [])

  const activeCategory = searchParams.get('category') || ''

  useEffect(() => {
    if (!activeCategory || categories.length === 0) {
      return
    }

    const autoExpandedIds = collectExpandedAncestors(categories, activeCategory)
    if (autoExpandedIds.size === 0) {
      return
    }

    setExpandedIds((prev) => {
      const next = new Set(prev)
      autoExpandedIds.forEach((id) => next.add(id))
      return next
    })
  }, [activeCategory, categories])

  const handleCategorySelect = (categoryKey) => {
    const nextSearchParams = new URLSearchParams(searchParams)
    if (activeCategory === categoryKey) {
      nextSearchParams.delete('category')
    } else {
      nextSearchParams.set('category', categoryKey)
    }
    nextSearchParams.delete('page')
    const nextSearch = nextSearchParams.toString()
    navigate(
      {
        pathname: '/',
        search: nextSearch ? `?${nextSearch}` : '',
      },
      { replace: location.pathname === '/' },
    )
  }

  const handleToggleExpand = (categoryId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  return (
    <aside className="sidebarMenu">
      {Array.isArray(config) && config.length > 0 ? (
        <nav className="sidebarMenuNav" aria-label="Main navigation">
          {config.map((item) => (
            <NavLink
              key={item.title}
              to={item.path}
              className={({ isActive }) =>
                `sidebarMenuItem${isActive ? ' sidebarMenuItemActive' : ''}`
              }
            >
              <i className={`fa-solid ${item.icon}`} aria-hidden="true" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </nav>
      ) : null}

      <section className="sidebarMenuCategories" aria-label="Kategorie">
        <div className="sidebarMenuCategoriesHead">
          <h3>Kategorie</h3>
        </div>
        {categories.length > 0 ? (
          <CategoryBranch
            nodes={categories}
            activeCategory={activeCategory}
            expandedIds={expandedIds}
            onSelect={handleCategorySelect}
            onToggleExpand={handleToggleExpand}
          />
        ) : (
          <p className="sidebarMenuCategoriesEmpty">Brak kategorii.</p>
        )}
      </section>
    </aside>
  )
}

export default SidebarMenu
