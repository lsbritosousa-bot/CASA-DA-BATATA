import { useState, useEffect, useMemo, FormEvent, ChangeEvent } from 'react';
import backgroundImage from './assets/background.jpg';
import logoImage from './assets/logo.jpg';
import { 
  ChefHat, 
  ShoppingCart, 
  Settings, 
  Menu as MenuIcon, 
  Ticket, 
  Plus, 
  Minus, 
  Trash2, 
  X, 
  Check, 
  PlusCircle, 
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from './lib/supabase';

// --- Types ---
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  tags: string[];
  category: 'batatas' | 'bebidas' | 'molhos' | 'acompanhamentos';
  active?: boolean;
}

interface CartItem extends Product {
  quantity: number;
  selectedTopping?: string;
}

interface Topping {
  id: string;
  name: string;
}

const INITIAL_TOPPINGS: Topping[] = [
  { id: '1', name: 'Cheddar' },
  { id: '2', name: 'Requeijão' }
];

interface Neighborhood {
  id: string;
  name: string;
  deliveryFee: number;
}

interface CalcIngredient {
  id: string;
  name: string;
  unit: 'kg' | 'unit';
  costPrice: number;
}

interface RecipeItem {
  ingredientId: string;
  quantity: number;
}

const INITIAL_CALC_INGREDIENTS: CalcIngredient[] = [
  { id: '1', name: 'Batata in Natura', unit: 'kg', costPrice: 6.00 },
  { id: '2', name: 'Bacon Artesanal', unit: 'kg', costPrice: 48.00 },
  { id: '3', name: 'Queijo Muçarela', unit: 'kg', costPrice: 38.00 },
  { id: '4', name: 'Embalagem Padrão', unit: 'unit', costPrice: 1.80 }
];

type View = 'menu' | 'cart' | 'admin';

// --- Initial Data ---
const INITIAL_NEIGHBORHOODS: Neighborhood[] = [
  { id: '1', name: 'Açaizal', deliveryFee: 8.00 },
  { id: '2', name: 'Alto do Vale', deliveryFee: 8.00 },
  { id: '3', name: 'Andradina', deliveryFee: 8.00 },
  { id: '4', name: 'Angelim', deliveryFee: 8.00 },
  { id: '5', name: 'Camboatã', deliveryFee: 8.00 },
  { id: '6', name: 'Célio Miranda', deliveryFee: 8.00 },
  { id: '7', name: 'Inocêncio Oliveira', deliveryFee: 8.00 },
  { id: '8', name: 'Jardim Atlântico', deliveryFee: 8.00 },
  { id: '9', name: 'Juparanã', deliveryFee: 8.00 },
  { id: '10', name: 'Manoel Nahor de Lima', deliveryFee: 8.00 },
  { id: '11', name: 'Nagib Demachki', deliveryFee: 8.00 },
  { id: '12', name: 'Nova Conquista', deliveryFee: 8.00 },
  { id: '13', name: 'Ouro Preto', deliveryFee: 8.00 },
  { id: '14', name: 'Ouro Verde', deliveryFee: 8.00 },
  { id: '15', name: 'Presidente Juscelino Kubitschek', deliveryFee: 8.00 },
  { id: '16', name: 'Promissão', deliveryFee: 8.00 },
  { id: '17', name: 'Sol Nascente', deliveryFee: 8.00 },
  { id: '18', name: 'Tião Mineiro', deliveryFee: 8.00 },
  { id: '19', name: 'Tropical', deliveryFee: 8.00 },
  { id: '20', name: 'Uraim', deliveryFee: 8.00 },
]; // Updated neighborhoods list for Paragominas

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Batata Bacon Clássica',
    description: 'Batata assada gigante recheada com muito queijo cremoso, bacon artesanal crocante e cebolinha frita.',
    price: 32.90,
    image: 'https://images.unsplash.com/photo-1541288097308-7b8e3f58c4c6?auto=format&fit=crop&q=80&w=400',
    tags: ['Mais Pedida', 'Gourmet'],
    category: 'batatas',
    active: true
  },
  {
    id: '2',
    name: 'Batata Calabresa Especial',
    description: 'Deliciosa calabresa acebolada com cream cheese, batata palha fininha e um toque de orégano.',
    price: 28.50,
    image: 'https://images.unsplash.com/photo-1621677243915-fcf476997096?auto=format&fit=crop&q=80&w=400',
    tags: ['Promoção'],
    category: 'batatas',
    active: true
  },
  {
    id: '3',
    name: 'Combo Happy Hour',
    description: '2 Batatas Médias (Frango c/ Catupiry) + 2 Refrigerantes lata + Batata Chips artesanal.',
    price: 64.00,
    image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&q=80&w=400',
    tags: ['Combo', 'Econômico'],
    category: 'batatas',
    active: true
  }
];

const CATEGORY_NAMES = {
  batatas: 'Batatas Recheadas 🥔',
  bebidas: 'Bebidas 🥤',
  molhos: 'Molhos Artesanais 🍯',
  acompanhamentos: 'Acompanhamentos 🍟'
};

// --- Sub-components ---

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => {
    return INITIAL_PRODUCTS;
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState<View>('menu');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [imageMethod, setImageMethod] = useState<'upload' | 'url'>('upload');

  // Estados de Bairros e Taxas de Entrega
  // Sempre reseta os bairros para INITIAL_NEIGHBORHOODS (Paragominas-PA)
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>(() => {
    return INITIAL_NEIGHBORHOODS;
  });
  const [adminTab, setAdminTab] = useState<'products' | 'delivery' | 'calculator' | 'toppings'>('products');
  const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
  const [newNeighborhoodFee, setNewNeighborhoodFee] = useState(0);

  const [toppings, setToppings] = useState<Topping[]>(() => {
    return INITIAL_TOPPINGS;
  });
  const [newToppingName, setNewToppingName] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [selectedTopping, setSelectedTopping] = useState<string>('');

  // Estados da Calculadora de Precificação
  // Estados da Calculadora de Precificação (Ficha Técnica)
  const [calcIngredients, setCalcIngredients] = useState<CalcIngredient[]>(() => {
    return INITIAL_CALC_INGREDIENTS;
  });
  const [currentRecipe, setCurrentRecipe] = useState<RecipeItem[]>([]);
  const [calcMargin, setCalcMargin] = useState<number>(20);

  // Estados do formulário de novo ingrediente
  const [newIngName, setNewIngName] = useState('');
  const [newIngUnit, setNewIngUnit] = useState<'kg' | 'unit'>('kg');
  const [newIngPrice, setNewIngPrice] = useState<number>(0);

  // Estados para adicionar item à receita atual
  const [selectedIngId, setSelectedIngId] = useState('');
  const [selectedIngQty, setSelectedIngQty] = useState<number>(0);

  // Estados de edição de ingredientes na calculadora
  const [editingIngredientId, setEditingIngredientId] = useState<string | null>(null);
  const [editIngName, setEditIngName] = useState('');
  const [editIngUnit, setEditIngUnit] = useState<'kg' | 'unit'>('kg');
  const [editIngPrice, setEditIngPrice] = useState<number>(0);

  // Estados do Formulário de Checkout no Carrinho
  const [customerName, setCustomerName] = useState('');
  const [selectedNeighborhoodId, setSelectedNeighborhoodId] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [referencePoint, setReferencePoint] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit');
  const [cardBrand, setCardBrand] = useState('Visa');
  const [needsChange, setNeedsChange] = useState<'yes' | 'no'>('no');
  const [changeValue, setChangeValue] = useState('');
  
  // New Product Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    price: 0,
    image: 'https://images.unsplash.com/photo-1518977676601-b53f02bad6?auto=format&fit=crop&q=80&w=400',
    tags: [],
    category: 'batatas',
    active: true
  });

  const [isLoading, setIsLoading] = useState(true);

  // Edit Product Form State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [imageMethodEdit, setImageMethodEdit] = useState<'upload' | 'url'>('upload');

  // Edit Recipe Item State (Calculadora)
  const [editingRecipeItemId, setEditingRecipeItemId] = useState<string | null>(null);
  const [editingRecipeItemQty, setEditingRecipeItemQty] = useState<number>(0);




  // Persist products
  useEffect(() => {
    try {
      localStorage.setItem('casa-da-batata-products', JSON.stringify(products));
    } catch (e) {
      console.warn('Erro ao salvar products no localStorage (Quota excedida?)', e);
    }
  }, [products]);

  // Persist bairros
  useEffect(() => {
    try {
      localStorage.setItem('casa-da-batata-neighborhoods', JSON.stringify(neighborhoods));
    } catch (e) {
      console.warn('Erro ao salvar bairros no localStorage', e);
    }
  }, [neighborhoods]);

  // Persist ingredientes da calculadora
  useEffect(() => {
    try {
      localStorage.setItem('casa-da-batata-calc-ingredients', JSON.stringify(calcIngredients));
    } catch (e) {
      console.warn('Erro ao salvar calcIngredients no localStorage', e);
    }
  }, [calcIngredients]);

  // Persist coberturas
  useEffect(() => {
    try {
      localStorage.setItem('casa-da-batata-toppings', JSON.stringify(toppings));
    } catch (e) {
      console.warn('Erro ao salvar coberturas no localStorage', e);
    }
  }, [toppings]);

  // Remover localStorage se der erro e carregar do Supabase
  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [productsRes, neighborhoodsRes, ingredientsRes] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('neighborhoods').select('*'),
          supabase.from('ingredients').select('*')
        ]);

        if (productsRes.error) throw productsRes.error;
        if (neighborhoodsRes.error) throw neighborhoodsRes.error;
        if (ingredientsRes.error) throw ingredientsRes.error;

        let dbProducts = productsRes.data || [];
        let dbNeighborhoods = neighborhoodsRes.data || [];
        let dbIngredients = ingredientsRes.data || [];
        let dbToppings = [];

        try {
          const toppingsRes = await supabase.from('toppings').select('*');
          if (!toppingsRes.error) {
            dbToppings = toppingsRes.data || [];
          } else {
            console.warn('Erro ao carregar coberturas do Supabase:', toppingsRes.error);
          }
        } catch (e) {
          console.warn('Erro ao conectar na tabela toppings do Supabase. Ignorando e usando LocalStorage.', e);
        }

        // Auto-seed se o banco de dados estiver vazio mas tivermos dados locais
        if (dbProducts.length === 0 && products.length > 0) {
          const toInsert = products.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.price,
            image: p.image,
            tags: p.tags,
            category: p.category,
            active: p.active !== undefined ? p.active : true
          }));
          const { error } = await supabase.from('products').insert(toInsert);
          if (!error) {
            console.log('Produtos sincronizados com o Supabase');
          } else {
            console.error('Erro ao sincronizar produtos:', error);
          }
          dbProducts = toInsert;
        }

        if (dbNeighborhoods.length === 0 && neighborhoods.length > 0) {
          const toInsert = neighborhoods.map(n => ({
            id: n.id,
            name: n.name,
            delivery_fee: n.deliveryFee
          }));
          const { error } = await supabase.from('neighborhoods').insert(toInsert);
          if (!error) {
            console.log('Bairros sincronizados com o Supabase');
          } else {
            console.error('Erro ao sincronizar bairros:', error);
          }
          dbNeighborhoods = toInsert;
        }

        if (dbIngredients.length === 0 && calcIngredients.length > 0) {
          const toInsert = calcIngredients.map(ing => ({
            id: ing.id,
            name: ing.name,
            unit: ing.unit,
            cost_price: ing.costPrice
          }));
          const { error } = await supabase.from('ingredients').insert(toInsert);
          if (!error) {
            console.log('Ingredientes sincronizados com o Supabase');
          } else {
            console.error('Erro ao sincronizar ingredientes:', error);
          }
          dbIngredients = toInsert;
        }

        if (dbToppings.length === 0 && toppings.length > 0) {
          const toInsert = toppings.map(t => ({
            id: t.id,
            name: t.name
          }));
          try {
            const { error } = await supabase.from('toppings').insert(toInsert);
            if (!error) {
              console.log('Coberturas sincronizadas com o Supabase');
            } else {
              console.error('Erro ao sincronizar coberturas:', error);
            }
          } catch (e) {
            console.warn('Erro ao salvar coberturas no Supabase:', e);
          }
          dbToppings = toInsert;
        }

        // Mapear dados do banco para os tipos locais (camelCase)
        const mappedProducts: Product[] = dbProducts.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          image: p.image || '',
          tags: Array.isArray(p.tags) ? p.tags : [],
          category: p.category as any,
          active: p.active !== undefined ? p.active : true
        }));

        const mappedNeighborhoods: Neighborhood[] = dbNeighborhoods.map((n: any) => ({
          id: n.id,
          name: n.name,
          deliveryFee: Number(n.delivery_fee)
        }));

        const mappedIngredients: CalcIngredient[] = dbIngredients.map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          unit: ing.unit as any,
          costPrice: Number(ing.cost_price)
        }));

        const mappedToppings: Topping[] = dbToppings.map((t: any) => ({
          id: t.id,
          name: t.name
        }));

        setProducts(mappedProducts);
        setNeighborhoods(mappedNeighborhoods);
        setCalcIngredients(mappedIngredients);
        setToppings(mappedToppings);
      } catch (err) {
        console.error('Falha ao carregar dados do Supabase, utilizando cache local:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Atalho F12 para acessar painel admin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault();
        setCurrentView('admin');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // --- Handlers ---
  const addToCart = (product: Product, topping?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedTopping === topping);
      if (existing) {
        return prev.map(item => (item.id === product.id && item.selectedTopping === topping) 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedTopping: topping }];
    });
  };

  const removeFromCart = (id: string, topping?: string) => {
    setCart(prev => prev.filter(item => !(item.id === id && item.selectedTopping === topping)));
  };

  const updateQuantity = (id: string, delta: number, topping?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === id && item.selectedTopping === topping) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleAddButtonClick = (product: Product) => {
    // Bloqueia a janela de coberturas para bebidas/refrigerantes, mesmo se a categoria estiver errada
    const isDrink = product.category === 'bebidas' || 
                    /(refrigerante|coca|fanta|guaran[aá]|sprite|água|suco|lata|litro|pepsi|kuat)/i.test(product.name);

    if (product.category === 'batatas' && !isDrink) {
      setCustomizingProduct(product);
      if (toppings.length > 0) {
        setSelectedTopping(toppings[0].name);
      } else {
        setSelectedTopping('');
      }
    } else {
      addToCart(product);
    }
  };

  const handleAddTopping = async (e: FormEvent) => {
    e.preventDefault();
    if (!newToppingName.trim()) return;

    const newTopping: Topping = {
      id: Date.now().toString(),
      name: newToppingName.trim()
    };

    setToppings(prev => [...prev, newTopping]);
    setNewToppingName('');

    if (supabase) {
      try {
        const { error } = await supabase.from('toppings').insert({
          id: newTopping.id,
          name: newTopping.name
        });
        if (error) console.error('Erro ao salvar no Supabase:', error);
      } catch (e) {
        console.warn('Erro ao salvar no Supabase. Usando LocalStorage.', e);
      }
    }
  };

  const handleDeleteTopping = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta cobertura?')) {
      setToppings(prev => prev.filter(t => t.id !== id));
      if (supabase) {
        try {
          const { error } = await supabase.from('toppings').delete().eq('id', id);
          if (error) console.error('Erro ao excluir no Supabase:', error);
        } catch (e) {
          console.warn('Erro ao excluir no Supabase. Usando LocalStorage.', e);
        }
      }
    }
  };

  const subtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  const totalItems = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const selectedNeighborhood = useMemo(() => {
    return neighborhoods.find(n => n.id === selectedNeighborhoodId);
  }, [neighborhoods, selectedNeighborhoodId]);

  const deliveryFee = selectedNeighborhood ? selectedNeighborhood.deliveryFee : 0;
  const orderTotal = subtotal + deliveryFee;

  const handleAddNeighborhood = async (e: FormEvent) => {
    e.preventDefault();
    if (!newNeighborhoodName.trim()) return;
    const id = Date.now().toString();
    const newNeigh: Neighborhood = {
      id,
      name: newNeighborhoodName.trim(),
      deliveryFee: newNeighborhoodFee
    };

    if (supabase) {
      const { error } = await supabase.from('neighborhoods').insert({
        id,
        name: newNeigh.name,
        delivery_fee: newNeigh.deliveryFee
      });
      if (error) {
        alert('Erro ao salvar bairro no banco de dados: ' + error.message);
        return;
      }
    }

    setNeighborhoods(prev => [...prev, newNeigh]);
    setNewNeighborhoodName('');
    setNewNeighborhoodFee(0);
  };

  const handleDeleteNeighborhood = async (id: string) => {
    if (confirm('Deseja excluir este bairro e sua taxa de entrega?')) {
      if (supabase) {
        const { error } = await supabase.from('neighborhoods').delete().eq('id', id);
        if (error) {
          alert('Erro ao excluir bairro no banco de dados: ' + error.message);
          return;
        }
      }
      setNeighborhoods(prev => prev.filter(n => n.id !== id));
      if (selectedNeighborhoodId === id) {
        setSelectedNeighborhoodId('');
      }
    }
  };

  const handleAddCalcIngredient = async (e: FormEvent) => {
    e.preventDefault();
    if (!newIngName.trim() || newIngPrice <= 0) return;
    const id = Date.now().toString();
    const newIng: CalcIngredient = {
      id,
      name: newIngName.trim(),
      unit: newIngUnit,
      costPrice: newIngPrice
    };

    if (supabase) {
      const { error } = await supabase.from('ingredients').insert({
        id,
        name: newIng.name,
        unit: newIng.unit,
        cost_price: newIng.costPrice
      });
      if (error) {
        alert('Erro ao salvar ingrediente no banco de dados: ' + error.message);
        return;
      }
    }

    setCalcIngredients(prev => [...prev, newIng]);
    setNewIngName('');
    setNewIngPrice(0);
  };

  const handleDeleteCalcIngredient = async (id: string) => {
    if (confirm('Deseja excluir este ingrediente? Ele também será removido de qualquer cálculo em andamento.')) {
      if (supabase) {
        const { error } = await supabase.from('ingredients').delete().eq('id', id);
        if (error) {
          alert('Erro ao excluir ingrediente no banco de dados: ' + error.message);
          return;
        }
      }
      setCalcIngredients(prev => prev.filter(ing => ing.id !== id));
      setCurrentRecipe(prev => prev.filter(item => item.ingredientId !== id));
    }
  };

  const handleUpdateCalcIngredient = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingIngredientId || !editIngName.trim() || editIngPrice <= 0) return;
    
    if (supabase) {
      const { error } = await supabase.from('ingredients').update({
        name: editIngName.trim(),
        unit: editIngUnit,
        cost_price: editIngPrice
      }).eq('id', editingIngredientId);
      if (error) {
        alert('Erro ao atualizar ingrediente no banco de dados: ' + error.message);
        return;
      }
    }

    setCalcIngredients(prev => prev.map(ing => ing.id === editingIngredientId 
      ? { ...ing, name: editIngName.trim(), unit: editIngUnit, costPrice: editIngPrice } 
      : ing
    ));
    setEditingIngredientId(null);
  };

  const handleAddRecipeItem = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedIngId || selectedIngQty <= 0) return;
    
    setCurrentRecipe(prev => {
      const existing = prev.find(item => item.ingredientId === selectedIngId);
      if (existing) {
        return prev.map(item => item.ingredientId === selectedIngId 
          ? { ...item, quantity: item.quantity + selectedIngQty } 
          : item
        );
      }
      return [...prev, { ingredientId: selectedIngId, quantity: selectedIngQty }];
    });
    
    setSelectedIngId('');
    setSelectedIngQty(0);
  };

  const handleDeleteRecipeItem = (ingredientId: string) => {
    setCurrentRecipe(prev => prev.filter(item => item.ingredientId !== ingredientId));
  };

  const handleSendWhatsApp = () => {
    if (!customerName.trim()) {
      alert('Por favor, preencha o seu nome.');
      return;
    }
    if (!selectedNeighborhoodId) {
      alert('Por favor, selecione o seu bairro.');
      return;
    }
    if (!streetAddress.trim()) {
      alert('Por favor, preencha a rua e o número.');
      return;
    }
    if (paymentMethod === 'cash' && needsChange === 'yes' && !changeValue.trim()) {
      alert('Por favor, informe para quanto precisa de troco.');
      return;
    }

    const selectedNeigh = neighborhoods.find(n => n.id === selectedNeighborhoodId);
    const fee = selectedNeigh ? selectedNeigh.deliveryFee : 0;
    const finalTotal = subtotal + fee;

    const header = "🥔 *NOVO PEDIDO - CASA DA BATATA* 🥔\n\n";
    
    // Dados do Cliente
    const customerInfo = `👤 *Cliente:* ${customerName.trim()}\n` +
      `📍 *Endereço:* ${streetAddress.trim()}\n` +
      `🏘️ *Bairro:* ${selectedNeigh ? selectedNeigh.name : ''}\n` +
      (referencePoint.trim() ? `🗺️ *Referência:* ${referencePoint.trim()}\n` : '') +
      `\n`;

    // Itens
    const itemsHeader = `🛒 *Itens do Pedido:*\n`;
    const items = cart.map(item => {
      const toppingText = item.selectedTopping ? ` (Cobertura: ${item.selectedTopping})` : '';
      return `• ${item.quantity}x ${item.name}${toppingText} - R$ ${(item.price * item.quantity).toFixed(2)}`;
    }).join('\n');
    
    // Pagamento
    let paymentText = '';
    if (paymentMethod === 'pix') {
      paymentText = `💵 *Forma de Pagamento:* PIX\n`;
    } else if (paymentMethod === 'card') {
      paymentText = `💳 *Forma de Pagamento:* Cartão de ${cardType === 'credit' ? 'Crédito' : 'Débito'} (${cardBrand})\n`;
    } else {
      paymentText = `💵 *Forma de Pagamento:* Dinheiro\n` + 
        (needsChange === 'yes' ? `🪙 *Precisa de troco para:* R$ ${changeValue.trim()}\n` : `🪙 *Não precisa de troco*\n`);
    }

    // Valores
    const totalsText = `\n` +
      `💵 *Subtotal:* R$ ${subtotal.toFixed(2)}\n` +
      `🛵 *Entrega:* R$ ${fee.toFixed(2)}\n` +
      `💰 *Total Geral:* R$ ${finalTotal.toFixed(2)}\n\n` +
      `_Pedido enviado pelo cardápio digital._`;

    const fullMessage = header + customerInfo + itemsHeader + items + '\n' + paymentText + totalsText;
    
    const messageEncoded = encodeURIComponent(fullMessage);
    window.open(`https://wa.me/5591991893808?text=${messageEncoded}`, '_blank');
  };

  const handleAdminLogin = (e: FormEvent) => {
    e.preventDefault();
    if (adminPassword === '240179') {
      setIsAdminLoggedIn(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    const id = Date.now().toString();
    const productToAdd = { ...newProduct, id, active: true } as Product;

    if (supabase) {
      const { error } = await supabase.from('products').insert({
        id,
        name: productToAdd.name,
        description: productToAdd.description,
        price: productToAdd.price,
        image: productToAdd.image,
        tags: productToAdd.tags,
        category: productToAdd.category,
        active: productToAdd.active
      });
      if (error) {
        alert('Erro ao salvar produto no banco de dados: ' + error.message);
        return;
      }
    }

    setProducts([...products, productToAdd]);
    setIsAddingProduct(false);
    setNewProduct({ 
      name: '', 
      description: '', 
      price: 0, 
      image: 'https://images.unsplash.com/photo-1518977676601-b53f02bad6?auto=format&fit=crop&q=80&w=400', 
      tags: [],
      category: 'batatas',
      active: true
    });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é muito grande. Escolha um arquivo menor que 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    if (supabase) {
      const { error } = await supabase.from('products').update({
        name: editingProduct.name,
        description: editingProduct.description,
        price: editingProduct.price,
        image: editingProduct.image,
        tags: editingProduct.tags,
        category: editingProduct.category,
        active: editingProduct.active
      }).eq('id', editingProduct.id);
      
      if (error) {
        alert('Erro ao atualizar produto no banco de dados: ' + error.message);
        return;
      }
    }

    setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
    setEditingProduct(null);
  };

  const handleEditProductImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      if (file.size > 2 * 1024 * 1024) {
        alert('A imagem é muito grande. Escolha um arquivo menor que 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingProduct(prev => prev ? { ...prev, image: reader.result as string } : null);
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm('Deseja excluir este produto?')) {
      if (supabase) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (error) {
          alert('Erro ao excluir produto no banco de dados: ' + error.message);
          return;
        }
      }
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  const toggleProductStatus = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const newActive = product.active === undefined ? false : !product.active;

    if (supabase) {
      const { error } = await supabase.from('products').update({
        active: newActive
      }).eq('id', id);
      if (error) {
        alert('Erro ao alterar status do produto no banco de dados: ' + error.message);
        return;
      }
    }

    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, active: newActive };
      }
      return p;
    }));
  };

  // --- Views ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-orange-500 relative z-50">
        <ChefHat size={64} className="animate-bounce mb-4 text-orange-500" />
        <h2 className="text-2xl font-bold text-zinc-100 mb-2">Casa da Batata</h2>
        <p className="text-zinc-400">Carregando cardápio quentinho...</p>
      </div>
    );
  }

  const Header = () => (
    <header className="fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-md z-50 border-b border-zinc-800/80 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('menu')}>
        <img 
          src={logoImage} 
          alt="Casa da Batata Logo" 
          className="w-10 h-10 rounded-lg object-cover border border-zinc-800"
        />
        <span className="font-bold text-zinc-100 text-lg tracking-tight">Casa da Batata</span>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={() => setCurrentView('cart')}
          className="relative p-2 text-zinc-400 hover:text-orange-500 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <ShoppingCart size={20} />
          {totalItems > 0 && (
            <span className="absolute top-0 right-0 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 py-2 px-6 flex justify-between items-center z-50 lg:max-w-md lg:mx-auto lg:rounded-t-3xl lg:shadow-2xl">
      <NavItem icon={MenuIcon} label="Menu" active={currentView === 'menu'} onClick={() => setCurrentView('menu')} />
      <NavItem icon={ShoppingCart} label="Carrinho" active={currentView === 'cart'} onClick={() => setCurrentView('cart')} hasBadge={totalItems > 0} badge={totalItems} />
      
    </nav>
  );

  const NavItem = ({ icon: Icon, label, active, onClick, hasBadge, badge }: { 
    icon: any, 
    label: string, 
    active: boolean, 
    onClick: () => void, 
    hasBadge?: boolean, 
    badge?: number 
  }) => (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-orange-500' : 'text-zinc-400 hover:text-zinc-200'}`}
    >
      <div className="relative">
        <Icon size={24} />
        {hasBadge && (
          <span className="absolute -top-1 -right-1 bg-orange-600 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen text-zinc-100 font-sans pb-24 selection:bg-orange-500/20 relative">
      {/* Imagem de Fundo */}
      <div 
        className="fixed inset-0 z-[-2] bg-cover bg-center bg-no-repeat pointer-events-none"
        style={{ 
          backgroundImage: `url(${backgroundImage})`
        }}
      />
      {/* Overlay escuro translúcido para combinar com a logo e criar um visual noturno premium */}
      <div className="fixed inset-0 z-[-1] bg-black/60 pointer-events-none" />

      <Header />

      <main className="max-w-2xl mx-auto pt-16">
        <AnimatePresence mode="wait">
          {currentView === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="px-4 py-6"
            >
              {/* Product List agrupado por Categoria */}
              <div className="space-y-8">
                {(['batatas', 'bebidas', 'molhos', 'acompanhamentos'] as const).map(catKey => {
                  const categoryProducts = products.filter(p => p.active !== false && p.category === catKey);
                  if (categoryProducts.length === 0) return null;
                  
                  return (
                    <div key={catKey} className="space-y-4">
                      <h3 className="text-xl font-bold text-zinc-100 border-b border-zinc-800 pb-2 mb-4 tracking-tight flex items-center justify-between">
                        <span>{CATEGORY_NAMES[catKey]}</span>
                        <span className="text-xs font-normal text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800">
                          {categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'itens'}
                        </span>
                      </h3>
                      <div className="space-y-4">
                        {categoryProducts.map(product => (
                          <div key={product.id}>
                            <ProductCard product={product} onAdd={() => handleAddButtonClick(product)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {currentView === 'cart' && (
            <motion.div 
              key="cart"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="px-4 py-8"
            >
              <h2 className="text-2xl font-bold mb-6 text-zinc-100">Seu Carrinho</h2>
              
              {cart.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/80 backdrop-blur-md rounded-3xl border border-dashed border-zinc-800">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-950 rounded-full text-zinc-400 mb-4">
                    <ShoppingCart size={32} />
                  </div>
                  <p className="text-zinc-400 font-medium">Seu carrinho está vazio.</p>
                  <button 
                    onClick={() => setCurrentView('menu')}
                    className="mt-4 text-orange-500 font-bold flex items-center gap-2 mx-auto"
                  >
                    Voltar para o Menu <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={`${item.id}-${item.selectedTopping || ''}`} className="flex items-center gap-4 bg-zinc-900/80 backdrop-blur-md p-3 rounded-2xl shadow-md border border-zinc-800/80">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-20 h-20 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-zinc-100 truncate">{item.name}</h4>
                          {item.selectedTopping && (
                            <p className="text-xs text-zinc-400 mt-0.5">
                              Cobertura: <span className="text-orange-500 font-extrabold">{item.selectedTopping}</span>
                            </p>
                          )}
                          <p className="text-orange-500 font-bold mt-1">R$ {item.price.toFixed(2)}</p>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-3 bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                              <button 
                                onClick={() => updateQuantity(item.id, -1, item.selectedTopping)}
                                className="p-1 hover:text-orange-500 transition-colors"
                              >
                                {item.quantity === 1 ? <Trash2 size={16} className="text-red-400" /> : <Minus size={16} />}
                              </button>
                              <span className="font-bold text-sm w-4 text-center text-zinc-100">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.id, 1, item.selectedTopping)}
                                className="p-1 hover:text-orange-500 transition-colors"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id, item.selectedTopping)}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Formulário de Endereço e Pagamento */}
                  <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-4">
                    <h3 className="text-lg font-bold text-zinc-100 border-b border-zinc-800 pb-2 mb-3">Informações de Entrega</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Nome Completo</label>
                        <input 
                          type="text" 
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Digite seu nome"
                          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-zinc-600"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Bairro</label>
                          <select 
                            required
                            value={selectedNeighborhoodId}
                            onChange={(e) => setSelectedNeighborhoodId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer"
                          >
                            <option value="">Selecione seu bairro</option>
                            {neighborhoods.map(n => (
                              <option key={n.id} value={n.id}>
                                {n.name} (R$ {n.deliveryFee.toFixed(2)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Rua e Número</label>
                          <input 
                            type="text" 
                            required
                            value={streetAddress}
                            onChange={(e) => setStreetAddress(e.target.value)}
                            placeholder="Ex: Av. Principal, 123"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-zinc-600"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase block mb-1">Ponto de Referência</label>
                        <input 
                          type="text" 
                          value={referencePoint}
                          onChange={(e) => setReferencePoint(e.target.value)}
                          placeholder="Ex: Próximo à praça central"
                          className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-zinc-600"
                        />
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-100 border-b border-zinc-800 pb-2 pt-2 mb-3">Forma de Pagamento</h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {(['pix', 'card', 'cash'] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-3 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            paymentMethod === method 
                              ? 'bg-orange-600 border-orange-500 text-white' 
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {method === 'pix' && 'PIX'}
                          {method === 'card' && 'Cartão'}
                          {method === 'cash' && 'Dinheiro'}
                        </button>
                      ))}
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Tipo</label>
                          <select
                            value={cardType}
                            onChange={(e) => setCardType(e.target.value as any)}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer"
                          >
                            <option value="credit">Crédito</option>
                            <option value="debit">Débito</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Bandeira</label>
                          <select
                            value={cardBrand}
                            onChange={(e) => setCardBrand(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all cursor-pointer"
                          >
                            <option value="Visa">Visa</option>
                            <option value="Mastercard">Mastercard</option>
                            <option value="Elo">Elo</option>
                            <option value="Hipercard">Hipercard</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'cash' && (
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                        <div>
                          <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Precisa de troco?</label>
                          <div className="flex gap-2">
                            {(['no', 'yes'] as const).map((opt) => (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => setNeedsChange(opt)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                  needsChange === opt 
                                    ? 'bg-orange-600/30 border-orange-500 text-orange-400' 
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                                }`}
                              >
                                {opt === 'yes' ? 'Sim' : 'Não'}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {needsChange === 'yes' && (
                          <div>
                            <label className="text-[10px] font-bold text-zinc-400 uppercase block mb-1">Troco para quanto?</label>
                            <input 
                              type="text"
                              value={changeValue}
                              onChange={(e) => setChangeValue(e.target.value)}
                              placeholder="Ex: R$ 50"
                              className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-zinc-700"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-900/90 backdrop-blur-md p-6 rounded-3xl shadow-md border border-zinc-800 space-y-3">
                    <div className="flex justify-between text-zinc-400 text-sm">
                      <span>Subtotal</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-zinc-400">Entrega</span>
                      <span className={selectedNeighborhoodId ? (deliveryFee === 0 ? 'text-emerald-400 font-bold' : 'text-zinc-300 font-bold') : 'text-zinc-500 italic'}>
                        {selectedNeighborhoodId
                          ? (deliveryFee === 0 ? 'Grátis 🎉' : `+ R$ ${deliveryFee.toFixed(2)}`)
                          : 'Selecione o bairro'}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                      <span className="font-bold text-lg text-zinc-100">Total</span>
                      <div className="text-right">
                        <span className="font-black text-2xl text-orange-500">R$ {orderTotal.toFixed(2)}</span>
                        {selectedNeighborhoodId && deliveryFee > 0 && (
                          <p className="text-[10px] text-zinc-500 mt-0.5">Inclui R$ {deliveryFee.toFixed(2)} de entrega</p>
                        )}
                      </div>
                    </div>

                    
                    <button 
                      onClick={handleSendWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] mt-4 cursor-pointer"
                    >
                      ENVIAR PEDIDO VIA WHATSAPP
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}


          {currentView === 'admin' && (
            <motion.div 
              key="admin"
              className="px-4 py-8"
            >
              {!isAdminLoggedIn ? (
                <div className="max-w-sm mx-auto bg-zinc-900/90 backdrop-blur-md p-8 rounded-3xl shadow-xl border border-zinc-800 mt-12">
                  <div className="flex justify-center mb-6">
                    <div className="bg-orange-500/20 p-4 rounded-full text-orange-500">
                      <ShieldCheck size={40} />
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-center mb-2 text-zinc-100">Acesso Restrito</h2>
                  <p className="text-zinc-400 text-sm text-center mb-8">Digite a senha administrativa para continuar.</p>
                  
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Digite sua senha"
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      />
                    </div>
                    <button className="w-full bg-orange-600 text-white font-bold py-3 rounded-xl hover:bg-orange-500 transition-colors cursor-pointer">
                      Entrar no Painel
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold text-zinc-100">Painel Admin</h2>
                    <button 
                      onClick={() => setIsAdminLoggedIn(false)}
                      className="text-zinc-400 hover:text-red-500 cursor-pointer"
                    >
                      Sair
                    </button>
                  </div>

                  {/* Seletor de Abas Admin */}
                  <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800 mb-6 flex-wrap sm:flex-nowrap">
                    <button
                      onClick={() => setAdminTab('products')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer min-w-[80px] ${
                        adminTab === 'products' 
                          ? 'bg-orange-600 text-white shadow-lg' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Produtos
                    </button>
                    <button
                      onClick={() => setAdminTab('delivery')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer min-w-[120px] ${
                        adminTab === 'delivery' 
                          ? 'bg-orange-600 text-white shadow-lg' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Taxas de Entrega
                    </button>
                    <button
                      onClick={() => setAdminTab('toppings')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer min-w-[100px] ${
                        adminTab === 'toppings' 
                          ? 'bg-orange-600 text-white shadow-lg' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Coberturas
                    </button>
                    <button
                      onClick={() => setAdminTab('calculator')}
                      className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer min-w-[100px] ${
                        adminTab === 'calculator' 
                          ? 'bg-orange-600 text-white shadow-lg' 
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Precificação
                    </button>
                  </div>

                  {adminTab === 'products' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <button 
                        onClick={() => setIsAddingProduct(true)}
                        className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 cursor-pointer"
                      >
                        <PlusCircle size={20} /> Adicionar Novo Produto
                      </button>

                      <div className="space-y-4">
                        <h3 className="font-bold text-zinc-400 text-sm uppercase tracking-wider">Produtos Atuais ({products.length})</h3>
                        {products.map(p => (
                          <div key={p.id} className={`bg-zinc-900/80 backdrop-blur-md p-3 rounded-2xl flex items-center gap-4 border border-zinc-800 transition-all ${p.active === false ? 'opacity-50' : ''}`}>
                            <img src={p.image} className="w-16 h-16 rounded-xl object-cover" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm text-zinc-100">{p.name}</h4>
                                {p.active === false && (
                                  <span className="text-[9px] bg-red-950 border border-red-800 text-red-400 font-bold px-1.5 py-0.5 rounded">
                                    Indisponível
                                  </span>
                                )}
                              </div>
                              <p className="text-orange-500 font-bold text-sm">R$ {p.price.toFixed(2)}</p>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                  onClick={() => toggleProductStatus(p.id)}
                                  className={`p-2 transition-colors cursor-pointer ${p.active !== false ? 'text-zinc-400 hover:text-orange-500' : 'text-orange-500 hover:text-orange-400'}`}
                                  title={p.active !== false ? "Desativar produto" : "Ativar produto"}
                               >
                                 {p.active !== false ? <Eye size={18} /> : <EyeOff size={18} />}
                               </button>
                               <button 
                                  onClick={() => {
                                    setEditingProduct(p);
                                    setImageMethodEdit(p.image.startsWith('data:') ? 'upload' : 'url');
                                  }}
                                  className="p-2 text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer"
                                  title="Editar produto"
                               >
                                  <Settings size={18} />
                               </button>
                               <button 
                                  onClick={() => deleteProduct(p.id)}
                                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
                               >
                                  <Trash2 size={18} />
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'delivery' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <form onSubmit={handleAddNeighborhood} className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-100 text-lg border-b border-zinc-800 pb-2 mb-3">Cadastrar Novo Bairro</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Nome do Bairro</label>
                            <input 
                              required
                              type="text" 
                              value={newNeighborhoodName}
                              onChange={(e) => setNewNeighborhoodName(e.target.value)}
                              placeholder="Ex: Nova Marabá"
                              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-zinc-700"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-zinc-400 uppercase">Taxa de Entrega (R$)</label>
                            <input 
                              required
                              type="number" 
                              step="0.01"
                              min="0"
                              value={newNeighborhoodFee === 0 ? '' : newNeighborhoodFee}
                              onChange={(e) => setNewNeighborhoodFee(parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                              className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-zinc-700"
                            />
                          </div>
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
                        >
                          <PlusCircle size={18} /> Cadastrar Bairro
                        </button>
                      </form>

                      <div className="space-y-3">
                        <h3 className="font-bold text-zinc-400 text-sm uppercase tracking-wider">Bairros e Taxas Atuais ({neighborhoods.length})</h3>
                        <div className="space-y-2">
                          {neighborhoods.map(n => (
                            <div key={n.id} className="bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between border border-zinc-800">
                              <div>
                                <h4 className="font-bold text-zinc-100 text-base">{n.name}</h4>
                                <p className="text-orange-500 font-extrabold text-sm mt-0.5">R$ {n.deliveryFee.toFixed(2)}</p>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleDeleteNeighborhood(n.id)}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-950 rounded-lg border border-zinc-800/50 transition-colors cursor-pointer"
                                title="Excluir Bairro"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'toppings' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      <form onSubmit={handleAddTopping} className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-100 text-lg border-b border-zinc-800 pb-2 mb-3">Cadastrar Nova Cobertura</h3>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-zinc-400 uppercase">Nome da Cobertura</label>
                          <input 
                            required
                            type="text" 
                            value={newToppingName}
                            onChange={(e) => setNewToppingName(e.target.value)}
                            placeholder="Ex: Cheddar Cremoso"
                            className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all placeholder-zinc-700"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer"
                        >
                          <PlusCircle size={18} /> Cadastrar Cobertura
                        </button>
                      </form>

                      <div className="space-y-3">
                        <h3 className="font-bold text-zinc-400 text-sm uppercase tracking-wider">Coberturas Cadastradas ({toppings.length})</h3>
                        <div className="space-y-2">
                          {toppings.map(t => (
                            <div key={t.id} className="bg-zinc-900/80 backdrop-blur-md p-4 rounded-2xl flex items-center justify-between border border-zinc-800">
                              <div>
                                <h4 className="font-bold text-zinc-100 text-base">{t.name}</h4>
                              </div>
                              <button 
                                type="button"
                                onClick={() => handleDeleteTopping(t.id)}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-zinc-950 rounded-lg border border-zinc-800/50 transition-colors cursor-pointer"
                                title="Excluir Cobertura"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {adminTab === 'calculator' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* 1. CADASTRO DE INSUMOS */}
                      <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-100 text-lg border-b border-zinc-800 pb-2 mb-3">1. Cadastrar Ingrediente / Insumo</h3>
                        
                        <form onSubmit={handleAddCalcIngredient} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Nome do Insumo</label>
                            <input 
                              type="text" 
                              required
                              value={newIngName}
                              onChange={(e) => setNewIngName(e.target.value)}
                              placeholder="Ex: Bacon, Queijo, Batata"
                              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-zinc-700"
                            />
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Tipo de Unidade</label>
                            <select 
                              value={newIngUnit}
                              onChange={(e) => setNewIngUnit(e.target.value as any)}
                              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer"
                            >
                              <option value="kg">Quilo (kg)</option>
                              <option value="unit">Unidade (un)</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                              Preço de Custo ({newIngUnit === 'kg' ? 'por Kg' : 'por Unidade'})
                            </label>
                            <div className="flex gap-2">
                              <input 
                                type="number" 
                                step="0.01"
                                min="0"
                                required
                                value={newIngPrice === 0 ? '' : newIngPrice}
                                onChange={(e) => setNewIngPrice(parseFloat(e.target.value) || 0)}
                                placeholder="R$ 0.00"
                                className="flex-1 px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-zinc-700"
                              />
                              <button 
                                type="submit"
                                className="bg-orange-600 hover:bg-orange-500 text-white font-bold px-4 rounded-xl flex items-center justify-center transition-all cursor-pointer text-xs"
                              >
                                Adicionar
                              </button>
                            </div>
                          </div>
                        </form>

                        {/* Lista de Insumos Cadastrados */}
                        <div className="space-y-2 pt-2">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Insumos Cadastrados ({calcIngredients.length})</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                            {calcIngredients.map(ing => (
                              <div key={ing.id} className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-bold text-zinc-200 block">{ing.name}</span>
                                  <span className="text-[10px] text-zinc-500">
                                    Custo: R$ {ing.costPrice.toFixed(2)} / {ing.unit === 'kg' ? 'kg' : 'un'}
                                  </span>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingIngredientId(ing.id);
                                      setEditIngName(ing.name);
                                      setEditIngUnit(ing.unit);
                                      setEditIngPrice(ing.costPrice);
                                    }}
                                    className="text-zinc-500 hover:text-orange-500 transition-colors p-1 cursor-pointer"
                                    title="Editar Insumo"
                                  >
                                    <Settings size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCalcIngredient(ing.id)}
                                    className="text-zinc-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                    title="Excluir Insumo"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 2. MONTAGEM DA FICHA TÉCNICA */}
                      <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-4">
                        <h3 className="font-bold text-zinc-100 text-lg border-b border-zinc-800 pb-2 mb-3">2. Montar Receita do Produto (Ficha Técnica)</h3>
                        
                        <form onSubmit={handleAddRecipeItem} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                          <div>
                            <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Selecionar Insumo</label>
                            <select 
                              required
                              value={selectedIngId}
                              onChange={(e) => setSelectedIngId(e.target.value)}
                              className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all cursor-pointer"
                            >
                              <option value="">Selecione...</option>
                              {calcIngredients.map(ing => (
                                <option key={ing.id} value={ing.id}>
                                  {ing.name} ({ing.unit === 'kg' ? 'kg' : 'un'})
                                </option>
                              ))}
                            </select>
                          </div>

                          {(() => {
                            const selectedIng = calcIngredients.find(i => i.id === selectedIngId);
                            const labelText = selectedIng 
                              ? `Quantidade Utilizada (${selectedIng.unit === 'kg' ? 'Gramas - g' : 'Unidades - un'})`
                              : 'Quantidade Utilizada';
                            const placeholderText = selectedIng 
                              ? (selectedIng.unit === 'kg' ? 'Ex: 150 (para 150g)' : 'Ex: 1 (para 1 unidade)')
                              : 'Informe a quantidade';

                            return (
                              <>
                                <div>
                                  <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">{labelText}</label>
                                  <input 
                                    type="number" 
                                    required
                                    min="1"
                                    value={selectedIngQty === 0 ? '' : selectedIngQty}
                                    onChange={(e) => setSelectedIngQty(parseInt(e.target.value) || 0)}
                                    placeholder={placeholderText}
                                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs focus:ring-2 focus:ring-orange-500 outline-none transition-all placeholder-zinc-700"
                                  />
                                </div>
                                <button 
                                  type="submit"
                                  className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer text-xs"
                                >
                                  Adicionar à Receita
                                </button>
                              </>
                            );
                          })()}
                        </form>

                        {/* Itens na Receita Atual */}
                        <div className="space-y-2 pt-2">
                          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Ingredientes na Batata / Produto</h4>
                          <div className="bg-zinc-950/60 rounded-2xl border border-zinc-800 overflow-hidden">
                            {currentRecipe.length === 0 ? (
                              <div className="p-6 text-center text-xs text-zinc-500 font-medium">
                                Nenhum ingrediente adicionado à receita. Selecione um insumo acima para começar.
                              </div>
                            ) : (
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-zinc-800 bg-zinc-950/90 text-zinc-400 font-bold uppercase tracking-wider">
                                    <th className="p-3">Ingrediente</th>
                                    <th className="p-3">Preço Base</th>
                                    <th className="p-3">Qtd. Utilizada</th>
                                    <th className="p-3">Custo Item</th>
                                    <th className="p-3 text-right">Ação</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {currentRecipe.map(item => {
                                    const ing = calcIngredients.find(i => i.id === item.ingredientId);
                                    if (!ing) return null;
                                    
                                    const itemCost = ing.unit === 'kg'
                                      ? (ing.costPrice / 1000) * item.quantity
                                      : ing.costPrice * item.quantity;

                                    return (
                                      <tr key={item.ingredientId} className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                                        <td className="p-3 font-bold text-zinc-200">{ing.name}</td>
                                        <td className="p-3 text-zinc-400">
                                          R$ {ing.costPrice.toFixed(2)} / {ing.unit === 'kg' ? 'kg' : 'un'}
                                        </td>
                                        <td className="p-3 text-zinc-200 font-medium">
                                          {editingRecipeItemId === item.ingredientId ? (
                                            <div className="flex items-center gap-1.5">
                                              <input
                                                type="number"
                                                min="1"
                                                autoFocus
                                                value={editingRecipeItemQty}
                                                onChange={(e) => setEditingRecipeItemQty(parseInt(e.target.value) || 0)}
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter' && editingRecipeItemQty > 0) {
                                                    setCurrentRecipe(prev => prev.map(ri => ri.ingredientId === item.ingredientId ? { ...ri, quantity: editingRecipeItemQty } : ri));
                                                    setEditingRecipeItemId(null);
                                                  }
                                                  if (e.key === 'Escape') setEditingRecipeItemId(null);
                                                }}
                                                className="w-20 px-2 py-1 rounded-lg bg-zinc-950 border-2 border-orange-500 text-orange-400 font-bold text-sm focus:ring-2 focus:ring-orange-500/50 outline-none"
                                              />
                                              <span className="text-xs text-zinc-400 font-medium">
                                                {ing.unit === 'kg' ? 'g' : 'un'}
                                              </span>
                                            </div>
                                          ) : (
                                            <button
                                              type="button"
                                              title="Clique para editar a quantidade"
                                              onClick={() => {
                                                setEditingRecipeItemId(item.ingredientId);
                                                setEditingRecipeItemQty(item.quantity);
                                              }}
                                              className="flex items-center gap-1.5 group cursor-pointer"
                                            >
                                              <span className="text-zinc-200 font-bold group-hover:text-orange-400 transition-colors">
                                                {item.quantity} {ing.unit === 'kg' ? 'g' : 'un'}
                                              </span>
                                              <Edit2 size={11} className="text-zinc-600 group-hover:text-orange-500 transition-colors" />
                                            </button>
                                          )}
                                        </td>
                                        <td className="p-3 text-orange-500 font-bold">R$ {itemCost.toFixed(2)}</td>
                                        <td className="p-3 text-right">
                                          <div className="flex justify-end gap-1.5">
                                            {editingRecipeItemId === item.ingredientId ? (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    if (editingRecipeItemQty <= 0) return;
                                                    setCurrentRecipe(prev => prev.map(ri => ri.ingredientId === item.ingredientId ? { ...ri, quantity: editingRecipeItemQty } : ri));
                                                    setEditingRecipeItemId(null);
                                                  }}
                                                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                  title="Salvar quantidade"
                                                >
                                                  <Check size={12} /> Salvar
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingRecipeItemId(null)}
                                                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                                  title="Cancelar"
                                                >
                                                  <X size={12} /> Cancelar
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const ing = calcIngredients.find(i => i.id === item.ingredientId);
                                                    if (ing) {
                                                      setEditIngName(ing.name);
                                                      setEditIngUnit(ing.unit as any);
                                                      setEditIngPrice(ing.costPrice);
                                                      setEditingIngredientId(item.ingredientId);
                                                    }
                                                  }}
                                                  className="text-zinc-500 hover:text-orange-500 transition-colors p-1 cursor-pointer"
                                                  title="Editar Insumo (nome, preço)"
                                                >
                                                  <Settings size={14} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteRecipeItem(item.ingredientId)}
                                                  className="text-zinc-500 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                                  title="Remover da receita"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 3. RESULTADOS E PRECIFICAÇÃO */}
                      {(() => {
                        const totalUnitCost = currentRecipe.reduce((sum, item) => {
                          const ing = calcIngredients.find(i => i.id === item.ingredientId);
                          if (!ing) return sum;
                          const itemCost = ing.unit === 'kg'
                            ? (ing.costPrice / 1000) * item.quantity
                            : ing.costPrice * item.quantity;
                          return sum + itemCost;
                        }, 0);

                        const marginPercent = calcMargin / 100;
                        const suggestedPrice = marginPercent < 1 ? totalUnitCost / (1 - marginPercent) : totalUnitCost;
                        const grossProfit = suggestedPrice - totalUnitCost;
                        const markupEquivalent = totalUnitCost > 0 ? (grossProfit / totalUnitCost) * 100 : 0;

                        return (
                          <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 space-y-4">
                            <h3 className="font-bold text-zinc-100 text-lg border-b border-zinc-800 pb-2 mb-3">3. Resultados da Precificação</h3>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Custo Unitário Total</span>
                                <span className="text-zinc-100 font-extrabold text-lg">R$ {totalUnitCost.toFixed(2)}</span>
                              </div>
                              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80 flex flex-col justify-between">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-1">Margem de Lucro (%)</span>
                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={calcMargin === 0 ? '' : calcMargin}
                                  onChange={(e) => setCalcMargin(Math.min(99, Math.max(0, parseFloat(e.target.value) || 0)))}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 text-sm focus:ring-2 focus:ring-orange-500 outline-none px-2 py-1"
                                />
                              </div>
                            </div>

                            <div className="bg-orange-600/10 p-5 rounded-2xl border border-orange-500/20 text-center space-y-1">
                              <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider block">Preço de Venda Sugerido (por Unidade)</span>
                              <span className="text-orange-500 font-black text-3xl">R$ {suggestedPrice.toFixed(2)}</span>
                              <span className="text-[9px] text-zinc-500 block pt-1">Fórmula: Custo Unitário / (1 - Margem%)</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/30 text-emerald-400">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Lucro Bruto / Venda</span>
                                <span className="font-extrabold text-lg text-emerald-400">R$ {grossProfit.toFixed(2)}</span>
                              </div>
                              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800/80">
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Markup (Retorno)</span>
                                <span className="text-zinc-300 font-extrabold text-lg">{markupEquivalent.toFixed(0)}%</span>
                              </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                              <button
                                type="button"
                                disabled={totalUnitCost === 0}
                                onClick={() => {
                                  setNewProduct(prev => ({ ...prev, price: parseFloat(suggestedPrice.toFixed(2)) }));
                                  setAdminTab('products');
                                  setIsAddingProduct(true);
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer text-xs"
                              >
                                Usar no Novo Produto
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />

      {/* Edit Calc Ingredient Modal */}
      <AnimatePresence>
        {editingIngredientId !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 border border-zinc-800 space-y-4"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-zinc-100">Editar Insumo</h3>
                <button 
                  type="button" 
                  onClick={() => setEditingIngredientId(null)} 
                  className="p-1 bg-zinc-950 text-zinc-100 rounded-full cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateCalcIngredient} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Nome do Insumo</label>
                  <input 
                    required
                    type="text" 
                    value={editIngName}
                    onChange={(e) => setEditIngName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Tipo de Unidade</label>
                    <select 
                      value={editIngUnit}
                      onChange={(e) => setEditIngUnit(e.target.value as any)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none cursor-pointer text-sm"
                    >
                      <option value="kg">Quilo (kg)</option>
                      <option value="unit">Unidade (un)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Preço de Custo</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      min="0"
                      value={editIngPrice === 0 ? '' : editIngPrice}
                      onChange={(e) => setEditIngPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingIngredientId(null)}
                    className="flex-1 py-3.5 font-bold text-zinc-400 cursor-pointer text-sm"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-orange-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-orange-600/20 cursor-pointer text-sm"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Product Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto border border-zinc-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Novo Produto</h3>
                <button onClick={() => setIsAddingProduct(false)} className="p-2 bg-zinc-950 text-zinc-100 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Nome do Produto</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Batata de Camarão"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-zinc-400 uppercase">Preço (R$)</label>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingProduct(false);
                          setAdminTab('calculator');
                        }}
                        className="text-[10px] text-orange-500 hover:underline cursor-pointer"
                      >
                        Calculadora
                      </button>
                    </div>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={newProduct.price === 0 ? '' : newProduct.price}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Categoria</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={newProduct.category || 'batatas'}
                      onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value as any })}
                    >
                      <option value="batatas">Batatas Recheadas</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="molhos">Molhos</option>
                      <option value="acompanhamentos">Acompanhamentos</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Tag Principal (ex: Mais Pedida, Promoção)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Gourmet"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    onChange={(e) => setNewProduct({ ...newProduct, tags: e.target.value ? [e.target.value] : [] })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase block">Imagem do Produto</label>
                  <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setImageMethod('upload')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageMethod === 'upload' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Fazer Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMethod('url')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageMethod === 'url' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Usar Link (URL)
                    </button>
                  </div>

                  {imageMethod === 'upload' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-950 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PlusCircle className="w-8 h-8 text-zinc-500 mb-2" />
                            <p className="text-xs text-zinc-400"><span className="font-bold">Clique para enviar</span> ou arraste</p>
                            <p className="text-[10px] text-zinc-500">PNG, JPG ou WEBP (Max. 2MB)</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleImageUpload} 
                          />
                        </label>
                      </div>
                      {newProduct.image && newProduct.image.startsWith('data:') && (
                        <div className="flex items-center gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                          <img 
                            src={newProduct.image} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded-lg border border-zinc-800" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-400 truncate">Imagem carregada com sucesso</p>
                            <button 
                              type="button" 
                              onClick={() => setNewProduct(prev => ({ ...prev, image: '' }))}
                              className="text-[10px] text-red-400 hover:underline"
                            >
                              Remover imagem
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={newProduct.image || ''}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      />
                      <p className="text-[10px] text-zinc-500">Dica: Insira uma URL de imagem válida.</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Descrição</label>
                  <textarea 
                    required
                    placeholder="Descreva os ingredientes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddingProduct(false)}
                    className="flex-1 py-4 font-bold text-zinc-400 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-600/20 cursor-pointer"
                  >
                    Salvar Produto
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {editingProduct !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 max-h-[90vh] overflow-y-auto border border-zinc-800"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-zinc-100">Editar Produto</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 bg-zinc-950 text-zinc-100 rounded-full cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Nome do Produto</label>
                  <input 
                    required
                    type="text" 
                    placeholder="Ex: Batata de Camarão"
                    value={editingProduct.name}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Preço (R$)</label>
                    <input 
                      required
                      type="number" 
                      step="0.01"
                      value={editingProduct.price === 0 ? '' : editingProduct.price}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 uppercase">Categoria</label>
                    <select 
                      required
                      className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                      value={editingProduct.category}
                      onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    >
                      <option value="batatas">Batatas Recheadas</option>
                      <option value="bebidas">Bebidas</option>
                      <option value="molhos">Molhos</option>
                      <option value="acompanhamentos">Acompanhamentos</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Tag Principal (ex: Mais Pedida, Promoção)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: Gourmet"
                    value={editingProduct.tags?.[0] || ''}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    onChange={(e) => setEditingProduct({ ...editingProduct, tags: e.target.value ? [e.target.value] : [] })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-400 uppercase block">Imagem do Produto</label>
                  <div className="flex gap-2 p-1 bg-zinc-950 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setImageMethodEdit('upload')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageMethodEdit === 'upload' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Fazer Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageMethodEdit('url')}
                      className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${imageMethodEdit === 'url' ? 'bg-orange-600 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                    >
                      Usar Link (URL)
                    </button>
                  </div>

                  {imageMethodEdit === 'upload' ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-zinc-800 border-dashed rounded-xl cursor-pointer bg-zinc-950/50 hover:bg-zinc-950 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <PlusCircle className="w-8 h-8 text-zinc-500 mb-2" />
                            <p className="text-xs text-zinc-400"><span className="font-bold">Clique para enviar</span> ou arraste</p>
                            <p className="text-[10px] text-zinc-500">PNG, JPG ou WEBP (Max. 2MB)</p>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleEditProductImageUpload} 
                          />
                        </label>
                      </div>
                      {editingProduct.image && (
                        <div className="flex items-center gap-3 p-2 bg-zinc-950 rounded-xl border border-zinc-800">
                          <img 
                            src={editingProduct.image} 
                            alt="Preview" 
                            className="w-12 h-12 object-cover rounded-lg border border-zinc-800" 
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-zinc-400 truncate">Imagem do produto</p>
                            <button 
                              type="button" 
                              onClick={() => setEditingProduct(prev => prev ? { ...prev, image: '' } : null)}
                              className="text-[10px] text-red-400 hover:underline"
                            >
                              Remover imagem
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input 
                        type="text" 
                        value={editingProduct.image || ''}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                        onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      />
                      <p className="text-[10px] text-zinc-500">Dica: Insira uma URL de imagem válida.</p>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-400 uppercase">Descrição</label>
                  <textarea 
                    required
                    placeholder="Descreva os ingredientes..."
                    rows={3}
                    value={editingProduct.description}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  ></textarea>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-4 font-bold text-zinc-400 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-600/20 cursor-pointer"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Coberturas */}
      <AnimatePresence>
        {customizingProduct !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-zinc-900 w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2.5rem] p-8 border border-zinc-800 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-orange-500 font-extrabold uppercase tracking-widest">Personalizar Batata</span>
                  <h3 className="text-xl font-black text-zinc-100 leading-tight">{customizingProduct.name}</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => setCustomizingProduct(null)} 
                  className="p-2 bg-zinc-950 text-zinc-100 rounded-full cursor-pointer hover:bg-zinc-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">Escolha a sua Cobertura:</label>
                
                {toppings.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">Nenhuma cobertura cadastrada pelo administrador.</p>
                ) : (
                  <div className="space-y-2">
                    {toppings.map(t => (
                      <label 
                        key={t.id} 
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                          selectedTopping === t.name 
                            ? 'bg-orange-600/10 border-orange-500 text-orange-500' 
                            : 'bg-zinc-950 border-zinc-850 text-zinc-300 hover:border-zinc-700'
                        }`}
                      >
                        <span className="font-bold text-sm">{t.name}</span>
                        <input 
                          type="radio" 
                          name="topping" 
                          value={t.name}
                          checked={selectedTopping === t.name}
                          onChange={() => setSelectedTopping(t.name)}
                          className="w-4 h-4 accent-orange-500 cursor-pointer"
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <button 
                type="button"
                onClick={() => {
                  addToCart(customizingProduct, selectedTopping || undefined);
                  setCustomizingProduct(null);
                }}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20 transition-all cursor-pointer active:scale-95"
              >
                <ShoppingCart size={18} /> Adicionar ao Carrinho
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onAdd: () => void;
}

const ProductCard = ({ product, onAdd }: ProductCardProps) => {
  const [isAdded, setIsAdded] = useState(false);

  const handleAdd = () => {
    onAdd();
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="bg-zinc-950/80 backdrop-blur-md rounded-[2rem] p-3 flex gap-4 shadow-xl hover:shadow-2xl transition-all border border-zinc-800/80 group relative">
      <div className="relative w-32 h-32 flex-shrink-0">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover rounded-2xl transition-transform duration-500 group-hover:scale-105"
          referrerPolicy="no-referrer"
        />
        {product.tags.length > 0 && (
          <span className="absolute top-2 left-2 bg-orange-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg">
            {product.tags[0]}
          </span>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h4 className="font-bold text-orange-500 text-lg leading-tight mb-1">{product.name}</h4>
          <p className="text-zinc-300 text-xs line-clamp-2 leading-relaxed">{product.description}</p>
        </div>
        
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">A partir de</span>
            <span className="text-orange-500 font-black text-xl italic leading-none">R$ {product.price.toFixed(2)}</span>
          </div>
          
          <button 
            onClick={handleAdd}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 cursor-pointer ${isAdded ? 'bg-emerald-600 text-white' : 'bg-zinc-100 text-zinc-950 shadow-xl hover:bg-orange-500 hover:text-white'}`}
          >
            {isAdded ? <Check size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
