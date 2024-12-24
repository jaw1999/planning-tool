PGDMP      +                |            military_planning    17.2    17.2 X    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    24827    military_planning    DATABASE     �   CREATE DATABASE military_planning WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';
 !   DROP DATABASE military_planning;
                     postgres    false                        2615    2200    public    SCHEMA     2   -- *not* creating schema, since initdb creates it
 2   -- *not* dropping schema, since initdb creates it
                     postgres    false            �           0    0    SCHEMA public    COMMENT         COMMENT ON SCHEMA public IS '';
                        postgres    false    5            �           0    0    SCHEMA public    ACL     +   REVOKE USAGE ON SCHEMA public FROM PUBLIC;
                        postgres    false    5            `           1247    24829    CostType    TYPE     �   CREATE TYPE public."CostType" AS ENUM (
    'ONE_TIME',
    'LICENSE',
    'FSR',
    'CONSUMABLE',
    'SHIPPING',
    'REFURBISHMENT',
    'SPARES',
    'TRAINING',
    'MAINTENANCE',
    'RECURRING'
);
    DROP TYPE public."CostType";
       public               postgres    false    5            c           1247    24850    EquipmentStatus    TYPE     r   CREATE TYPE public."EquipmentStatus" AS ENUM (
    'AVAILABLE',
    'IN_USE',
    'MAINTENANCE',
    'RETIRED'
);
 $   DROP TYPE public."EquipmentStatus";
       public               postgres    false    5            f           1247    24860    ExerciseStatus    TYPE     �   CREATE TYPE public."ExerciseStatus" AS ENUM (
    'PLANNING',
    'APPROVED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);
 #   DROP TYPE public."ExerciseStatus";
       public               postgres    false    5            i           1247    24872    FSRFrequency    TYPE     �   CREATE TYPE public."FSRFrequency" AS ENUM (
    'DAILY',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY',
    'QUARTERLY',
    'SEMIANNUAL',
    'ANNUAL',
    'AS_NEEDED'
);
 !   DROP TYPE public."FSRFrequency";
       public               postgres    false    5            l           1247    24890    FSRType    TYPE     b   CREATE TYPE public."FSRType" AS ENUM (
    'NONE',
    'WEEKLY',
    'BIWEEKLY',
    'MONTHLY'
);
    DROP TYPE public."FSRType";
       public               postgres    false    5            o           1247    24900    Role    TYPE     ]   CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'PLANNER',
    'VIEWER',
    'GUEST'
);
    DROP TYPE public."Role";
       public               postgres    false    5            r           1247    24910 
   UserStatus    TYPE     J   CREATE TYPE public."UserStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE'
);
    DROP TYPE public."UserStatus";
       public               postgres    false    5            �            1259    32776    ApiLog    TABLE     �   CREATE TABLE public."ApiLog" (
    id text NOT NULL,
    path text NOT NULL,
    method text NOT NULL,
    duration double precision NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    "statusCode" integer NOT NULL
);
    DROP TABLE public."ApiLog";
       public         heap r       postgres    false    5            �            1259    25091 
   Consumable    TABLE     a  CREATE TABLE public."Consumable" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    unit text NOT NULL,
    "currentUnitCost" double precision NOT NULL,
    category text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
     DROP TABLE public."Consumable";
       public         heap r       postgres    false    5            �            1259    25099    ConsumablePreset    TABLE     U  CREATE TABLE public."ConsumablePreset" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "consumableId" text NOT NULL,
    quantity double precision NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 &   DROP TABLE public."ConsumablePreset";
       public         heap r       postgres    false    5            �            1259    24915    Cost    TABLE     �  CREATE TABLE public."Cost" (
    id text NOT NULL,
    type public."CostType" NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text,
    category text,
    "exerciseId" text,
    "systemId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."Cost";
       public         heap r       postgres    false    5    864            �            1259    24921 
   CostRecord    TABLE     �  CREATE TABLE public."CostRecord" (
    id text NOT NULL,
    "exerciseId" text,
    "systemId" text,
    type public."CostType" NOT NULL,
    amount double precision NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    description text,
    category text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
     DROP TABLE public."CostRecord";
       public         heap r       postgres    false    864    5            �            1259    24927    EquipmentDocument    TABLE     7  CREATE TABLE public."EquipmentDocument" (
    id text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    "equipmentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 '   DROP TABLE public."EquipmentDocument";
       public         heap r       postgres    false    5            �            1259    24933    EquipmentRelation    TABLE     $  CREATE TABLE public."EquipmentRelation" (
    id text NOT NULL,
    type text NOT NULL,
    "systemAId" text NOT NULL,
    "systemBId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 '   DROP TABLE public."EquipmentRelation";
       public         heap r       postgres    false    5            �            1259    24939    Exercise    TABLE     $  CREATE TABLE public."Exercise" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    location text,
    status public."ExerciseStatus" DEFAULT 'PLANNING'::public."ExerciseStatus" NOT NULL,
    "totalBudget" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "launchesPerDay" integer DEFAULT 1 NOT NULL
);
    DROP TABLE public."Exercise";
       public         heap r       postgres    false    870    5    870            �            1259    25107    ExerciseConsumablePreset    TABLE     8  CREATE TABLE public."ExerciseConsumablePreset" (
    id text NOT NULL,
    "exerciseSystemId" text NOT NULL,
    "presetId" text NOT NULL,
    quantity integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 .   DROP TABLE public."ExerciseConsumablePreset";
       public         heap r       postgres    false    5            �            1259    24946    ExerciseSystem    TABLE     �  CREATE TABLE public."ExerciseSystem" (
    id text NOT NULL,
    "exerciseId" text NOT NULL,
    "systemId" text NOT NULL,
    quantity integer NOT NULL,
    "fsrSupport" public."FSRType" DEFAULT 'NONE'::public."FSRType" NOT NULL,
    "fsrCost" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "launchesPerDay" integer DEFAULT 1 NOT NULL
);
 $   DROP TABLE public."ExerciseSystem";
       public         heap r       postgres    false    876    5    876            �            1259    24953    Organization    TABLE       CREATE TABLE public."Organization" (
    id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    location text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 "   DROP TABLE public."Organization";
       public         heap r       postgres    false    5            �            1259    32798    PasswordReset    TABLE     (  CREATE TABLE public."PasswordReset" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    used boolean DEFAULT false NOT NULL
);
 #   DROP TABLE public."PasswordReset";
       public         heap r       postgres    false    5            �            1259    24959 
   Permission    TABLE       CREATE TABLE public."Permission" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    roles jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
     DROP TABLE public."Permission";
       public         heap r       postgres    false    5            �            1259    32783    Settings    TABLE     �  CREATE TABLE public."Settings" (
    id integer DEFAULT 1 NOT NULL,
    "siteName" text DEFAULT 'Planning Tool'::text NOT NULL,
    "defaultCurrency" text DEFAULT 'USD'::text NOT NULL,
    notifications boolean DEFAULT true NOT NULL,
    "autoSave" boolean DEFAULT true NOT NULL,
    timezone text DEFAULT 'UTC'::text NOT NULL,
    "dateFormat" text DEFAULT 'DD/MM/YYYY'::text NOT NULL,
    language text DEFAULT 'en'::text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."Settings";
       public         heap r       postgres    false    5            �            1259    24965    System    TABLE     �  CREATE TABLE public."System" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "basePrice" double precision NOT NULL,
    "hasLicensing" boolean DEFAULT false NOT NULL,
    "licensePrice" double precision,
    "leadTime" integer NOT NULL,
    specifications jsonb,
    "consumablesRate" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."System";
       public         heap r       postgres    false    5            �            1259    24972    SystemDocument    TABLE     1  CREATE TABLE public."SystemDocument" (
    id text NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    "systemId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
 $   DROP TABLE public."SystemDocument";
       public         heap r       postgres    false    5            �            1259    24978    User    TABLE     �  CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'VIEWER'::public."Role" NOT NULL,
    status public."UserStatus" DEFAULT 'ACTIVE'::public."UserStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public."User";
       public         heap r       postgres    false    879    882    5    879    882            �            1259    24986    _prisma_migrations    TABLE     �  CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);
 &   DROP TABLE public._prisma_migrations;
       public         heap r       postgres    false    5            �            1259    24993 	   equipment    TABLE     �  CREATE TABLE public.equipment (
    id text NOT NULL,
    "productInfo" jsonb NOT NULL,
    "physicalSpecifications" jsonb NOT NULL,
    "systemComponents" jsonb NOT NULL,
    interfaces jsonb NOT NULL,
    "powerSpecifications" jsonb NOT NULL,
    "environmentalSpecifications" jsonb NOT NULL,
    software jsonb,
    operations jsonb NOT NULL,
    logistics jsonb NOT NULL,
    integration jsonb NOT NULL,
    status public."EquipmentStatus" DEFAULT 'AVAILABLE'::public."EquipmentStatus" NOT NULL,
    "fsrFrequency" public."FSRFrequency" DEFAULT 'AS_NEEDED'::public."FSRFrequency" NOT NULL,
    "acquisitionCost" double precision,
    "fsrSupportCost" double precision,
    location text,
    "serialNumber" text,
    "assetTag" text,
    notes text,
    "organizationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);
    DROP TABLE public.equipment;
       public         heap r       postgres    false    867    873    873    867    5            �          0    32776    ApiLog 
   TABLE DATA           Y   COPY public."ApiLog" (id, path, method, duration, "timestamp", "statusCode") FROM stdin;
    public               postgres    false    233   �       �          0    25091 
   Consumable 
   TABLE DATA           �   COPY public."Consumable" (id, name, description, unit, "currentUnitCost", category, notes, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    230   	�       �          0    25099    ConsumablePreset 
   TABLE DATA           ~   COPY public."ConsumablePreset" (id, name, description, "consumableId", quantity, notes, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    231   v�       �          0    24915    Cost 
   TABLE DATA           �   COPY public."Cost" (id, type, amount, date, description, category, "exerciseId", "systemId", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    217   ݅       �          0    24921 
   CostRecord 
   TABLE DATA           �   COPY public."CostRecord" (id, "exerciseId", "systemId", type, amount, date, description, category, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    218   ��       �          0    24927    EquipmentDocument 
   TABLE DATA           l   COPY public."EquipmentDocument" (id, title, type, url, "equipmentId", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    219   �       �          0    24933    EquipmentRelation 
   TABLE DATA           k   COPY public."EquipmentRelation" (id, type, "systemAId", "systemBId", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    220   4�       �          0    24939    Exercise 
   TABLE DATA           �   COPY public."Exercise" (id, name, description, "startDate", "endDate", location, status, "totalBudget", "createdAt", "updatedAt", "launchesPerDay") FROM stdin;
    public               postgres    false    221   Q�       �          0    25107    ExerciseConsumablePreset 
   TABLE DATA           |   COPY public."ExerciseConsumablePreset" (id, "exerciseSystemId", "presetId", quantity, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    232   n�       �          0    24946    ExerciseSystem 
   TABLE DATA           �   COPY public."ExerciseSystem" (id, "exerciseId", "systemId", quantity, "fsrSupport", "fsrCost", "createdAt", "updatedAt", "launchesPerDay") FROM stdin;
    public               postgres    false    222   ��       �          0    24953    Organization 
   TABLE DATA           \   COPY public."Organization" (id, name, type, location, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    223   ��       �          0    32798    PasswordReset 
   TABLE DATA           ^   COPY public."PasswordReset" (id, token, "userId", "expiresAt", "createdAt", used) FROM stdin;
    public               postgres    false    235   ņ       �          0    24959 
   Permission 
   TABLE DATA           ^   COPY public."Permission" (id, name, description, roles, "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    224   �       �          0    32783    Settings 
   TABLE DATA           �   COPY public."Settings" (id, "siteName", "defaultCurrency", notifications, "autoSave", timezone, "dateFormat", language, "updatedAt") FROM stdin;
    public               postgres    false    234   ��       �          0    24965    System 
   TABLE DATA           �   COPY public."System" (id, name, description, "basePrice", "hasLicensing", "licensePrice", "leadTime", specifications, "consumablesRate", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    225   [�       �          0    24972    SystemDocument 
   TABLE DATA           f   COPY public."SystemDocument" (id, title, type, url, "systemId", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    226   x�       �          0    24978    User 
   TABLE DATA           p   COPY public."User" (id, name, email, password, role, status, "createdAt", "lastLogin", "updatedAt") FROM stdin;
    public               postgres    false    227   ��       �          0    24986    _prisma_migrations 
   TABLE DATA           �   COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
    public               postgres    false    228   ��       �          0    24993 	   equipment 
   TABLE DATA           j  COPY public.equipment (id, "productInfo", "physicalSpecifications", "systemComponents", interfaces, "powerSpecifications", "environmentalSpecifications", software, operations, logistics, integration, status, "fsrFrequency", "acquisitionCost", "fsrSupportCost", location, "serialNumber", "assetTag", notes, "organizationId", "createdAt", "updatedAt") FROM stdin;
    public               postgres    false    229   [�       �           2606    32782    ApiLog ApiLog_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public."ApiLog"
    ADD CONSTRAINT "ApiLog_pkey" PRIMARY KEY (id);
 @   ALTER TABLE ONLY public."ApiLog" DROP CONSTRAINT "ApiLog_pkey";
       public                 postgres    false    233            �           2606    25106 &   ConsumablePreset ConsumablePreset_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public."ConsumablePreset"
    ADD CONSTRAINT "ConsumablePreset_pkey" PRIMARY KEY (id);
 T   ALTER TABLE ONLY public."ConsumablePreset" DROP CONSTRAINT "ConsumablePreset_pkey";
       public                 postgres    false    231            �           2606    25098    Consumable Consumable_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."Consumable"
    ADD CONSTRAINT "Consumable_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."Consumable" DROP CONSTRAINT "Consumable_pkey";
       public                 postgres    false    230            �           2606    25026    CostRecord CostRecord_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."CostRecord"
    ADD CONSTRAINT "CostRecord_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."CostRecord" DROP CONSTRAINT "CostRecord_pkey";
       public                 postgres    false    218            �           2606    25028    Cost Cost_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."Cost"
    ADD CONSTRAINT "Cost_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."Cost" DROP CONSTRAINT "Cost_pkey";
       public                 postgres    false    217            �           2606    25030 (   EquipmentDocument EquipmentDocument_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public."EquipmentDocument"
    ADD CONSTRAINT "EquipmentDocument_pkey" PRIMARY KEY (id);
 V   ALTER TABLE ONLY public."EquipmentDocument" DROP CONSTRAINT "EquipmentDocument_pkey";
       public                 postgres    false    219            �           2606    25032 (   EquipmentRelation EquipmentRelation_pkey 
   CONSTRAINT     j   ALTER TABLE ONLY public."EquipmentRelation"
    ADD CONSTRAINT "EquipmentRelation_pkey" PRIMARY KEY (id);
 V   ALTER TABLE ONLY public."EquipmentRelation" DROP CONSTRAINT "EquipmentRelation_pkey";
       public                 postgres    false    220            �           2606    25114 6   ExerciseConsumablePreset ExerciseConsumablePreset_pkey 
   CONSTRAINT     x   ALTER TABLE ONLY public."ExerciseConsumablePreset"
    ADD CONSTRAINT "ExerciseConsumablePreset_pkey" PRIMARY KEY (id);
 d   ALTER TABLE ONLY public."ExerciseConsumablePreset" DROP CONSTRAINT "ExerciseConsumablePreset_pkey";
       public                 postgres    false    232            �           2606    25034 "   ExerciseSystem ExerciseSystem_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public."ExerciseSystem"
    ADD CONSTRAINT "ExerciseSystem_pkey" PRIMARY KEY (id);
 P   ALTER TABLE ONLY public."ExerciseSystem" DROP CONSTRAINT "ExerciseSystem_pkey";
       public                 postgres    false    222            �           2606    25036    Exercise Exercise_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Exercise"
    ADD CONSTRAINT "Exercise_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Exercise" DROP CONSTRAINT "Exercise_pkey";
       public                 postgres    false    221            �           2606    25038    Organization Organization_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public."Organization"
    ADD CONSTRAINT "Organization_pkey" PRIMARY KEY (id);
 L   ALTER TABLE ONLY public."Organization" DROP CONSTRAINT "Organization_pkey";
       public                 postgres    false    223                       2606    32806     PasswordReset PasswordReset_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public."PasswordReset"
    ADD CONSTRAINT "PasswordReset_pkey" PRIMARY KEY (id);
 N   ALTER TABLE ONLY public."PasswordReset" DROP CONSTRAINT "PasswordReset_pkey";
       public                 postgres    false    235            �           2606    25040    Permission Permission_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);
 H   ALTER TABLE ONLY public."Permission" DROP CONSTRAINT "Permission_pkey";
       public                 postgres    false    224            �           2606    32797    Settings Settings_pkey 
   CONSTRAINT     X   ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_pkey" PRIMARY KEY (id);
 D   ALTER TABLE ONLY public."Settings" DROP CONSTRAINT "Settings_pkey";
       public                 postgres    false    234            �           2606    25042 "   SystemDocument SystemDocument_pkey 
   CONSTRAINT     d   ALTER TABLE ONLY public."SystemDocument"
    ADD CONSTRAINT "SystemDocument_pkey" PRIMARY KEY (id);
 P   ALTER TABLE ONLY public."SystemDocument" DROP CONSTRAINT "SystemDocument_pkey";
       public                 postgres    false    226            �           2606    25044    System System_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public."System"
    ADD CONSTRAINT "System_pkey" PRIMARY KEY (id);
 @   ALTER TABLE ONLY public."System" DROP CONSTRAINT "System_pkey";
       public                 postgres    false    225            �           2606    25046    User User_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);
 <   ALTER TABLE ONLY public."User" DROP CONSTRAINT "User_pkey";
       public                 postgres    false    227            �           2606    25048 *   _prisma_migrations _prisma_migrations_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public._prisma_migrations DROP CONSTRAINT _prisma_migrations_pkey;
       public                 postgres    false    228            �           2606    25050    equipment equipment_pkey 
   CONSTRAINT     V   ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT equipment_pkey PRIMARY KEY (id);
 B   ALTER TABLE ONLY public.equipment DROP CONSTRAINT equipment_pkey;
       public                 postgres    false    229            �           1259    25051 )   EquipmentRelation_systemAId_systemBId_key    INDEX     �   CREATE UNIQUE INDEX "EquipmentRelation_systemAId_systemBId_key" ON public."EquipmentRelation" USING btree ("systemAId", "systemBId");
 ?   DROP INDEX public."EquipmentRelation_systemAId_systemBId_key";
       public                 postgres    false    220    220            �           1259    25115 6   ExerciseConsumablePreset_exerciseSystemId_presetId_key    INDEX     �   CREATE UNIQUE INDEX "ExerciseConsumablePreset_exerciseSystemId_presetId_key" ON public."ExerciseConsumablePreset" USING btree ("exerciseSystemId", "presetId");
 L   DROP INDEX public."ExerciseConsumablePreset_exerciseSystemId_presetId_key";
       public                 postgres    false    232    232            �           1259    25052 &   ExerciseSystem_exerciseId_systemId_key    INDEX     �   CREATE UNIQUE INDEX "ExerciseSystem_exerciseId_systemId_key" ON public."ExerciseSystem" USING btree ("exerciseId", "systemId");
 <   DROP INDEX public."ExerciseSystem_exerciseId_systemId_key";
       public                 postgres    false    222    222                       1259    32807    PasswordReset_token_key    INDEX     ]   CREATE UNIQUE INDEX "PasswordReset_token_key" ON public."PasswordReset" USING btree (token);
 -   DROP INDEX public."PasswordReset_token_key";
       public                 postgres    false    235            �           1259    25053    System_name_key    INDEX     M   CREATE UNIQUE INDEX "System_name_key" ON public."System" USING btree (name);
 %   DROP INDEX public."System_name_key";
       public                 postgres    false    225            �           1259    25054    User_email_key    INDEX     K   CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);
 $   DROP INDEX public."User_email_key";
       public                 postgres    false    227            
           2606    25116 3   ConsumablePreset ConsumablePreset_consumableId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ConsumablePreset"
    ADD CONSTRAINT "ConsumablePreset_consumableId_fkey" FOREIGN KEY ("consumableId") REFERENCES public."Consumable"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 a   ALTER TABLE ONLY public."ConsumablePreset" DROP CONSTRAINT "ConsumablePreset_consumableId_fkey";
       public               postgres    false    231    230    4854                       2606    25055 4   EquipmentDocument EquipmentDocument_equipmentId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."EquipmentDocument"
    ADD CONSTRAINT "EquipmentDocument_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 b   ALTER TABLE ONLY public."EquipmentDocument" DROP CONSTRAINT "EquipmentDocument_equipmentId_fkey";
       public               postgres    false    4852    219    229                       2606    25060 2   EquipmentRelation EquipmentRelation_systemAId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."EquipmentRelation"
    ADD CONSTRAINT "EquipmentRelation_systemAId_fkey" FOREIGN KEY ("systemAId") REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 `   ALTER TABLE ONLY public."EquipmentRelation" DROP CONSTRAINT "EquipmentRelation_systemAId_fkey";
       public               postgres    false    229    4852    220                       2606    25065 2   EquipmentRelation EquipmentRelation_systemBId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."EquipmentRelation"
    ADD CONSTRAINT "EquipmentRelation_systemBId_fkey" FOREIGN KEY ("systemBId") REFERENCES public.equipment(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 `   ALTER TABLE ONLY public."EquipmentRelation" DROP CONSTRAINT "EquipmentRelation_systemBId_fkey";
       public               postgres    false    220    4852    229                       2606    25121 G   ExerciseConsumablePreset ExerciseConsumablePreset_exerciseSystemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ExerciseConsumablePreset"
    ADD CONSTRAINT "ExerciseConsumablePreset_exerciseSystemId_fkey" FOREIGN KEY ("exerciseSystemId") REFERENCES public."ExerciseSystem"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 u   ALTER TABLE ONLY public."ExerciseConsumablePreset" DROP CONSTRAINT "ExerciseConsumablePreset_exerciseSystemId_fkey";
       public               postgres    false    222    4836    232                       2606    25126 ?   ExerciseConsumablePreset ExerciseConsumablePreset_presetId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ExerciseConsumablePreset"
    ADD CONSTRAINT "ExerciseConsumablePreset_presetId_fkey" FOREIGN KEY ("presetId") REFERENCES public."ConsumablePreset"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 m   ALTER TABLE ONLY public."ExerciseConsumablePreset" DROP CONSTRAINT "ExerciseConsumablePreset_presetId_fkey";
       public               postgres    false    231    232    4856                       2606    25070 -   ExerciseSystem ExerciseSystem_exerciseId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ExerciseSystem"
    ADD CONSTRAINT "ExerciseSystem_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES public."Exercise"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 [   ALTER TABLE ONLY public."ExerciseSystem" DROP CONSTRAINT "ExerciseSystem_exerciseId_fkey";
       public               postgres    false    4833    222    221                       2606    25075 +   ExerciseSystem ExerciseSystem_systemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."ExerciseSystem"
    ADD CONSTRAINT "ExerciseSystem_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES public."System"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Y   ALTER TABLE ONLY public."ExerciseSystem" DROP CONSTRAINT "ExerciseSystem_systemId_fkey";
       public               postgres    false    225    222    4843                       2606    32808 '   PasswordReset PasswordReset_userId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."PasswordReset"
    ADD CONSTRAINT "PasswordReset_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 U   ALTER TABLE ONLY public."PasswordReset" DROP CONSTRAINT "PasswordReset_userId_fkey";
       public               postgres    false    4848    227    235                       2606    25080 +   SystemDocument SystemDocument_systemId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public."SystemDocument"
    ADD CONSTRAINT "SystemDocument_systemId_fkey" FOREIGN KEY ("systemId") REFERENCES public."System"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
 Y   ALTER TABLE ONLY public."SystemDocument" DROP CONSTRAINT "SystemDocument_systemId_fkey";
       public               postgres    false    226    4843    225            	           2606    25085 '   equipment equipment_organizationId_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.equipment
    ADD CONSTRAINT "equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public."Organization"(id) ON UPDATE CASCADE ON DELETE SET NULL;
 S   ALTER TABLE ONLY public.equipment DROP CONSTRAINT "equipment_organizationId_fkey";
       public               postgres    false    229    4838    223            �      x������ � �      �   ]   x�K�5��7�2�200()6,5)�,,IK�(��H��,����L+QHO,�L.UH+�4�t�9��Lt�t�L�M�L��-�q�s��qqq ɤl      �   W   x�K�5��7�2�200()6,5)�,,IK�(��H��,����L+QHO,�LƩҐ�����D��H��H��������R����8W� f�!a      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �      x������ � �      �   L   x�3��I����KW����v�,��gN}__�H �L��4202�54�52V00�20�20�3�0����� ��      �      x������ � �      �      x������ � �      �     x�uνr�@�zy

[w��PE����h����*#*`�>:�L��S�so�E���^`�na�m��p̬$/�5���,β�$H������Jr�
t��`Թ�x�^��&�6��5o}�-e2��ŘsǛ�b�d����S�[}�]@o0�C�s����ŤK��-�2�!h2�ᣗ)v���i��#熺(���U,
}-O������.O�$���ˇ;�:n�:�xjZS�m�⟣:.���F�3炎?��_���1�R�)�e3a��� ��L�BMӾ aQo-      �   �   x�m�K
�0��)z�'Y���'+r ��z�Yf3��y��J�,g6u��,K����=4J����a�6>V�r�p+*3�֋T^,�8S�16�]�zeدS����y�����߇����Q�ה��l-�      �      x��\�r�ȑ�����!�	
 /Q�p,u�<RK#R���t8@�Hbl���7s���
��u�@�:��v{�#�
ugee~_V���1����ٶݼ�����/���ݛ_k�7�=V�NF^���q�i�p�_�{���O��q�ꬖ=,����y<�!���\|�f^�����g���%O� �C�.�${��G<��-�v�h�S?	�l�6��,/̂,s67��҇4�sl�^����T��wg������������QE����������F=�u��aй�A��
�����+�2�^�K���.��,K8���'���$N�^�s��Y�Y�<�F!�Z6�}��s�DR���܃�#N�[By��#Ͽ�X�����Q��a�Ca&0�䡐0;q]�hA�<�A�����o>�ZS5���
V���teb�ˋ!;����4	�A>g�����$�L(=�Ub����a���Gc!�P~�M��O4#?�����B�+m�.Nx�娳Y��G���˼���)�Z�+�9��Y���h�f��8�DX!�$�Ny�S���s�E�����=��$cS/e�k'Y�q�� L
G��q���Pq�e���@�2D0���9l�s�z�ˊD~Gm���C�̿��t�q���"�4!};uW�����<I�IG�J��/O�:�tĠ~��
�vd3q���E{:�tN���^Ǩ�X�&�Ơi4�Z�`Y̜6���,eiNB�>�1�_�������<�|l���"��e�E��/��)�gu�p��y"�T����~QQ��"���7�������xS#m�3�<��V��7ZL`.'��s��e�^�,y ��4� ��!W�Sm��BssP�,N��P9�2��r(<hL�fA��@�EYO���Eϕt3���}-@_�+���瑗��tc���-�Q���8pe.��� �I0U���<�x�V&�� k�1�'ٝ�б)��	_�Q���]���f'!��ÊY�{8 � �v��-������7GGߟ��<'4(Y�ҪD!(����4���P	P��a�Z��E��~���F��뙗G�LDm�8J'��6@����B�8�l撬����U�U�0[��� mE�FU���%��,�	��1��p���S�/@iA�W�H��{P*bz4�1_���fay6���Ka2�t7FU�o̃̐��m
��M܇�jc��v66vV;��Ak!��Y�����$	�!�<�A����$���K��{s�- OSZ���8B����a-z�kK��	��fB��P(�� �
�;Sy�ᑟ�~���h��K���4��$B�"l0�]����iG�@�Kmg6�C�J�)J�̭n��Q�X���t��/�=%�Q�m��1XCp�eGђ����%��:˳բ�U�{ױ;�U�N8����ǟ�J�277]�[xj�]���1!�5�%6:E��%��B�0{S7��Э*}�n�h�xP3��O���h��I׀+�����Y���0�oH]޸�����w����۲ �;f���6����6=��G�0�\諅,�c�.�|�~-�pi��5��"R��BR��\R'&��s�Q�WP���msl��+��$�BD
����.���)^�j�Rᙬ[��}c�_=�4�FS��+m�Z]W��u�{'��%_U�T>2Պ5a�L=���nq\�p��56�SBȪ�WŐ�v���+���XàU����x��y�$C��o��+%�%�.�o�ɫzOy������w���t�^N�{�f��=��}!�o�{N��v�������O��F2�����t��|�˯d[_��[_���=X0��:(��?��י@�M��1�J�����o7�����3��&���2��m��wE�"�fM���v�����3�v����@��};�_�St�X�7��:��y)Ul#%�5ר�z.��`���:H;=ۻ��A�G�68=9}7�9�a��R��P��c���m���D�a��D�F��:�$qp�]Z��Op���)H� ]�b/#H���a.�����lCݣ3X�����y�s|q}�.yc��:s�p�V�� (<Ag`be3n��'l�'�_�
Qg����Bb����B��Zel�i���?��[������?�;��a]�=Fy�O@l#�s��9�]����e�&�f�o?!Vn�Ux��]�����y6��tطZ=���e!E�.``� o`e�}�3lwn�(��'�a��CB6��%s��u�*|�6{cv���m.��f�u4%�!�GmV���g��'vz>�ɔ�{!����)R���f>t�?8]�:%�[�<yÑ	|�{��yV@���JVN-��$�b?�q�'*��+�+�R�#,ߝ����>��<�#�1@�6��_�^6����
�(G�|׿:bs0��B�JZA�}K�@U_C~�%����4�����`�&9�U��j���x�@]��n]( }Z`��U�������PB���EpR�x���pe�
�C�'I�/�c5�u@6p�Hfƺ\�$��@�]{	6����	�Y%0U�\K ѷ��Oy�u�W�i��v�����-*Ck�e��\�& �B�q3S����Gc�u1y)m��$�r��Dj���u���E���_��qڽN�~�$
��9Ξ�৳�9��h��t(��(��ɉ>eS�@��A����~��#��T�*L�t-�m�q>c���lW����!@���N����D>A�R��������[��`x��1>��wn{.ݣ %�Z��N���V��n�8`G�	���� ��〓 �j�q��^�l	�Ϭ}(!����
���>}�c]��;L�!�K�A��[����K`�6f�|B��<���������i�S(2���2~ -Ϫ@x�
��e�Ko��=���6��\ ���vK��X{�G2�r}�c����X�s8j˪R�/N$]�P���1�u4�=g>O.�����b�V�w6#�u#A��U3A.���;p�p5t�p`Aʥ�{��戟�	����.Nn?	U9|���>�J��Ux��k�>���0��7
�v�v�Y��g��ކ��Dwy H���.�>��b�l��x�G�k�m\�K�&�$����{+�B��e��ta�/��`�p�u�fKE},�ٖ��줘1�+$�͉�݄R\}��/Q�4�WVNl���'wdq&x��o��l���U>��1��)���f�Y:"8���QC��<��T�wl�Xa�XxS���'w,���?(��c:��}F���ﶀ�G9�U��l�M�߿ٜC���!y)_u[dv����]�T���i��0����]��!>9��|�Cb-�vD��yu����A�aGF�|2ۀ�œ�U���-tf*H0�&Ia˞���u�����ֿZnC�nv���s�x�:򷰉p&�8G<ӕ�ũ3�f�VO��w�i�Zx�q�x/��>	K� �Rm먿�6е���-��+������'��r�U͓ W-rqҖq�	����R4���<�'�K�;�0).@��;@H3�2]/��^��ʌ��+���.�XByV�jf�[>୾,䵦��2�TB�z���*�f�v�M2#�*�^��0�(_��%<�GF�#ޖ&���y#P��jӜ�QZ`���ݶ�q@&�j�f�V"U�m�*�X�6a������	��=��"`�"�tK��(J���K��U!�rĴ���)lO�̿�Ep�� �,���G�U���8Ѿ�?����̴.S.0/K��R�9@,�dԹ�"�2G��|"P� �}�P'|(\�io�!#s�W�%kôE1;tko@��;+�K�����|�H0�����qs
0!�	#SEBGo�C,r��KKxK�H��(��F�]؂ilQ\��q��]�FXiK�5X�(���XH}�4��=��$���S<,1�'n�[lZQ���P�{֛n�兇\�0�����w!�䣯I������^R]D��W��;�b=B��%�[7 ���3&���cDBy(�c�(� �
  �N���-� T��8�A�j-�C	J����,{^�c�􃤚&˫�ڐ�U��ëR%"6/�_���4���X��8��(1=b1�T^S�&T�j�(ۃJC*��<����lO,. D����ZHr��G���m��[q��"�;����f�cFa+�������{Jx)���(SR�(?�&���h�/`��r�V���b�g!a0.�i
q�f�� �ɍ��ݚ�j+.Y���b����{��>^�˵��x���I�S�m���$<G�����itw�MωZ��#�N��/�-#p�nMjM1_�y �w��b�����*w�p��ΠOΆM���9v���s	�^���[��h�[��/����ᘂd3/S!�T��G"(ˎ��e�ğx#��j��⪿Mn@gM���t���b u��Ol8�B<���Q�7F�y1�E�@p�K�~�m����1
q��Yv�-w���9a2�q����m68���ZΔ	/s��1 Rc��w��^�S:Z��~\'�����,��;�]��nk��w�5�S��WC��e��t�F�n�$��ߺgJf�����Ԉ���"n
N�Y��J���϶���i�lW��W�<��iԪOzqgq28�c�m��z6���ҿ=!���� �\g.P�:k�ŔΆG�Ԃ?���7��]l�M���~dsC���=������M���v�����!C&3>8�*0C�B�
Y�)��d���^���nQ�:wt��J�X�ZU�ק�v6>J�Qz g���(\��Mp�i�`x<Q�XLKv#�G�ܐ$IB��q�ّa�^��R8w-�Z��m^'!p�5O���G:Ox�X�ص�)=��U,���B���!�,U�㆏�S�������a��T�s/���(=a?��*�m�F�����p�d]���� Lg"�"0�|�֏��V�j�
J��0Py��OM.�6sUn [�5�29&��ӝy	b^����(������b�� ��@O�.�KoZ7���	�_֟�1���ό�i�8���E�i/�1��J�6%��Q� ���Yp��&K�l�������9�V�V�%��^����f�OEevK�Z�J���!�x^�RJ�'"sxzE�k��(Jv.EJr_����Ҕ�G ���ۺv��h��p�Y��pM)�Q`��#I�'!���7U�+]d��k��〇c`9@��\�D�H�M�d������ȍ\��S΀�'���=x�VW!��N�e}���P�8eO�
]ɖ�W{���'W^�U��J���cn������׸p够��O0�JV+y�6�U�V�Q	S,y�\�Ǘ�җLڪ�ˉM"��F���G���o���"d��񱶳��vs�s��¹=>��جٱ����(��[|��`h5پ���W��f��톳����	vU�Ty���3���a���:�bF2�o��~�X�f?��x�nJ��f}ᩁ�b����p^�`�~�3`d9��c��!XtEd�>�	�D%�۽vZ�H�F��R�d|>�L����9���Mb������(_Û�J>ɘ����ӗ�cwK}��cQd�^ ������9�}v���oG��E�9(��$M��pE1|Ag��KU~�@	�Q�hZ�N�	.�%(p��c���$��!#O��,� �.���@!�̋z7�/,���c�`�\9�HA�'���{/(;� ��8(|�=ۺ�S��Jw�P�9ݛ5 &	*౧&S��+&^^�30~E�W�;P}V�=�U�U0����,��?N2AdB�*�V��MH���ԋ�)���	�y��c��E�������uy����ۉY��"�+b�`q��.;���c�x���+~V��;��P� Z=� 4��% 7���O�����e[�Wa?����˘�y�t[n��K�������-f�Ϯ(k}e['ק�"l����^]�?���+ �q���\��w�)�']g��P��Ep���Z@�@ŧl
Q^�s��X$���H�)~�T���E�uA��s�X�������*#�.�=y�N�hBK��1L�*S#�ҭ6���s��)���l3�E��[�X�։�_���4�#��6����&�gh{��N@}2��O^G�:R�Qܝ�}��۸\C
��A	�[g��9v�' ��̈́ce�Ս�I ����������dk�"D;F��g܌���d&4�g_�ҷ�u=�კ�e�r� �X�M%M�䑪����,�"�Uf�+g�>Rɲ�^��	.��*'���I�|�9���+��(����-�@P.;�K�ۚ�X><�1pL��Уg��+]u&�a	[���6��؍�䔅}i�<�����O\X�m+6_u�9�������ɋ�H��ηٝ���B�e�!��rr�-�n��H�`�U?P��&�|����0fk9��>���)��n�X����xw����	��]�-n=��~[
mQЄ��if�����f�ꎺ��3<��zn���p�-�2$�wd��x{����Z��Ud2��A�[�_[�&�>�#�)��4�=��%���PW��� �6p�	�{��d!�	��uj��e7�
L�k�Ш�t�9&�F^�9ݮ�.9������C{+%	��l��� ����r��?+��Z���1�����I�__0��gJ�) �z��v�����Ӄ�m֢ ���3�H5�r��#�W��^r*�l̩���v�������}���6s�     