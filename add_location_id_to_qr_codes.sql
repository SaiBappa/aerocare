ALTER TABLE public.building_qr_codes
ADD COLUMN location_id BIGINT REFERENCES public.locations (id);