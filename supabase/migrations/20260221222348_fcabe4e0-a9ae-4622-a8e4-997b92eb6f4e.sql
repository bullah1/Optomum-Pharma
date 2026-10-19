
-- Add foreign key from orders.user_id to profiles.id
ALTER TABLE public.orders
ADD CONSTRAINT orders_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add foreign key from prescriptions.user_id to profiles.id
ALTER TABLE public.prescriptions
ADD CONSTRAINT prescriptions_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add foreign key from payments.user_id to profiles.id
ALTER TABLE public.payments
ADD CONSTRAINT payments_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add foreign key from notifications.user_id to profiles.id
ALTER TABLE public.notifications
ADD CONSTRAINT notifications_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add foreign key from reviews.user_id to profiles.id
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);

-- Add foreign key from user_roles.user_id to profiles.id
ALTER TABLE public.user_roles
ADD CONSTRAINT user_roles_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id);
