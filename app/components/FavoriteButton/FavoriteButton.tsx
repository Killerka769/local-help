"use client";

import { memo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import styles from "./FavoriteButton.module.scss";

interface FavoriteButtonProps {
  requestId: string;
  authorId: string;
  size?: "small" | "medium";
}

function FavoriteButton({ requestId, authorId, size = "medium" }: FavoriteButtonProps) {
  const { user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const isFav = isFavorite(requestId);
  const isOwnRequest = user?.id === authorId;

  if (!user || isOwnRequest) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFav) {
      removeFavorite.mutate(requestId);
    } else {
      addFavorite.mutate(requestId);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${styles.button} ${size === "small" ? styles.small : styles.medium} ${
        isFav ? styles.active : ""
      }`}
      disabled={addFavorite.isPending || removeFavorite.isPending}
      title={isFav ? "Удалить из избранного" : "Добавить в избранное"}
    >
      {isFav ? "★" : "☆"}
    </button>
  );
}

export default memo(FavoriteButton);