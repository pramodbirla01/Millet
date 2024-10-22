"use client";

import React, { useEffect, useState, useContext, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/app/firebase';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import 'remixicon/fonts/remixicon.css';
import { CartContext } from '@/Context/CartContext';
import Footer from '@/app/Bottom/Footer';
import Nav from '@/app/Head/Nav';
const ProductDetails = ({ params }) => {
  const { productId } = params;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState('');
  const router = useRouter();
  const { addToCart } = useContext(CartContext);
  const scrollContainer = useRef(null);

  const scroll = (direction) => {
    if (scrollContainer.current) {
      const scrollAmount = 300;
      const newScrollPosition = 
        scrollContainer.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainer.current.scrollTo({
        left: newScrollPosition,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!productId) return;

      try {
        const productRef = doc(db, 'products', productId);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          const productData = productSnap.data();
          setProduct(productData);
          setSelectedImage(productData.mainImage);
          await fetchCategoryAndTagNames(productData);
          await fetchRelatedProducts(productData);
        } else {
          setError('No such product found!');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError('Error fetching product details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

  const fetchCategoryAndTagNames = async (productData) => {
    try {
      if (Array.isArray(productData.categories) && productData.categories.length > 0) {
        const categoryQuery = query(collection(db, 'categories'), where('__name__', 'in', productData.categories));
        const categorySnapshot = await getDocs(categoryQuery);
        const fetchedCategoryNames = categorySnapshot.docs.map(doc => doc.data().name);
        setCategories(fetchedCategoryNames);
      }

      if (Array.isArray(productData.tags) && productData.tags.length > 0) {
        const tagQuery = query(collection(db, 'tags'), where('__name__', 'in', productData.tags));
        const tagSnapshot = await getDocs(tagQuery);
        const fetchedTagNames = tagSnapshot.docs.map(doc => doc.data().name);
        setTags(fetchedTagNames);
      }
    } catch (error) {
      console.error('Error fetching category/tag names:', error);
      setError('Error fetching category or tag names.');
    }
  };

  const fetchRelatedProducts = async (productData) => {
    try {
      if (productData.categories && productData.categories.length > 0) {
        setLoadingRelated(true);
        const relatedQuery = query(
          collection(db, 'products'),
          where('categories', 'array-contains-any', productData.categories)
        );
  
        const relatedSnapshot = await getDocs(relatedQuery);
        const relatedProductsData = relatedSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(product => product.id !== productData.id);
  
        setRelatedProducts(relatedProductsData.length > 0 ? relatedProductsData : []);
      } else {
        setRelatedProducts([]);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
      setRelatedProducts([]);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
    }
  };

  const handleOrderNow = () => {
    console.log('Order now clicked');
  };

  const handleRelatedProductClick = (id) => {
    router.push(`/Shop/${id}`);
  };

  if (loading) {
    return <div>Loading product details...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  return (
    <>
    <Nav/>
    <div className="flex items-center mb-4 px-4 sm:px-6">
      <button
        onClick={() => router.push('/Shop')}
        className="flex items-center bg-green-600 text-white mt-6 sm:mt-10 py-2 px-3 rounded-md shadow-lg hover:bg-blue-500 transition duration-200"
      >
        <ChevronLeft className="mr-2" />
        <span className="text-sm">Back to Shop</span>
      </button>
    </div>
  
    <div className="p-4 sm:p-6 font-afacadFlux bg-gray-100">
      {/* Main Product Container */}
      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded-lg shadow-lg flex flex-col md:flex-row">
        {/* Left Side: Product Image Selector */}
        <div className="w-full md:w-1/2 mb-6 md:mb-0">
          <img
            src={selectedImage}
            alt={product.name}
            className="w-full h-auto object-contain border-2 border-green-500 rounded-lg mb-4"
          />
          {product.additionalImages && product.additionalImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              {product.additionalImages.map((image, index) => (
                <img
                  key={index}
                  src={image}
                  alt={`Additional Image ${index + 1}`}
                  className="w-full p-1 sm:p-2 h-auto border border-green-500 object-cover rounded-lg cursor-pointer hover:border-green-700"
                  onClick={() => setSelectedImage(image)}
                />
              ))}
            </div>
          )}
        </div>
  
        {/* Right Side: Product Details */}
        <div className="flex-grow md:pl-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Price: ₹{product.price}</p>
          <p className="text-gray-600 mb-4">In Stock: {product.stock}</p>
          <p className="text-gray-600 mb-4">{product.description}</p>
  
          {/* Quantity Selector */}
          <div className="flex items-center mb-4">
            <button className="border border-gray-300 px-3 py-1 rounded-l">-</button>
            <input 
              type="number" 
              className="border-t border-b border-gray-300 w-16 text-center py-1" 
              defaultValue="1"
            />
            <button className="border border-gray-300 px-3 py-1 rounded-r">+</button>
          </div>
  
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mb-6">
            <button
              onClick={handleAddToCart}
              className="w-full sm:w-auto bg-green-600 text-white py-2 px-4 shadow-lg hover:bg-green-500 transition duration-200 rounded-md"
            >
              Add To Cart
            </button>
            <button
              onClick={handleOrderNow}
              className="w-full sm:w-auto bg-green-600 text-white py-2 px-4 shadow-lg hover:bg-green-500 transition duration-200 rounded-md"
            >
              Buy Now
            </button>
          </div>
  
          {/* Categories and Tags */}
          <div className="flex flex-col items-start mb-4 pt-4">
            {categories.length > 0 && (
              <p className="text-sm text-gray-500 mb-1">
                <span className="font-semibold">Categories:</span> {categories.join(', ')}
              </p>
            )}
            {tags.length > 0 && (
              <p className="text-sm text-gray-500">
                <span className="font-semibold">Tags:</span> {tags.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
  
      {/* Related Products Section */}
      <div className="relative w-full mt-6 sm:mt-8">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 px-4 sm:px-0">Related Products</h2>
        
        {loadingRelated ? (
          <p className="text-gray-500 px-4">Loading related products...</p>
        ) : (
          <div className="relative group px-4 sm:px-0">
            {/* Left Arrow - Hidden on mobile */}
            <button
              onClick={() => scroll('left')}
              className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50"
            >
              <i className="ri-arrow-left-s-line text-xl"></i>
            </button>
  
            {/* Scrollable Container */}
            <div 
              ref={scrollContainer}
              className="flex overflow-x-auto gap-3 sm:gap-4 pb-4 scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {relatedProducts.length > 0 ? (
                relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="flex-none w-48 sm:w-64 aspect-square cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleRelatedProductClick(relatedProduct.id)}
                  >
                    <div className="h-full bg-white border rounded-lg p-2 sm:p-4 shadow-md flex flex-col">
                      <div className="relative flex-1 mb-2">
                        <img
                          src={relatedProduct.mainImage}
                          alt={relatedProduct.name}
                          className="absolute inset-0 w-full h-full object-cover rounded-md"
                        />
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold truncate">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-sm text-gray-600">₹{relatedProduct.price}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No related products found.</p>
              )}
            </div>
  
            {/* Right Arrow - Hidden on mobile */}
            <button
              onClick={() => scroll('right')}
              className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-2 shadow-md border border-gray-200 hover:bg-gray-50"
            >
              <i className="ri-arrow-right-s-line text-xl"></i>
            </button>
          </div>
        )}
      </div>
    </div>
    <Footer/>
  </>
  );
};

export default ProductDetails;