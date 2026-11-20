import { ArrowDown, ArrowUp, Bell, Menu, SlidersHorizontal, Star } from "lucide-react";
import {
  Button,
  cx,
  glyphClass,
  IconButton,
  ProviderIcon,
  reducedMotion,
  ShowMore,
  TabDock,
  useUi,
} from "@myton/ui";
import { Callout } from "@/components/Callout";
import { Field } from "@/components/Field";
import { TabPager } from "@/components/TabPager";
import { TelegramLoginButton } from "@/components/TelegramLoginButton";
import { rankInFilters, selectCatalog } from "@/data/query";
import { hydrateFromServer } from "@/data/sync";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useAppliedLang } from "@/i18n";
import { isStart, PAGE_SIZE } from "@myton/ui/domain";
import { locales } from "@myton/ui/locale";
import { COLD_ROWS } from "@/lib/skeletons";
import { notify } from "@/lib/telegram";
import { useAuth } from "@/stores/auth";
import { useCatalog } from "@/stores/catalog";
import { type Tab, useCatalogQuery } from "@/stores/catalogQuery";
import { useFavorites } from "@/stores/favorites";
import { useNames } from "@/stores/names";
import { useSubscriptions } from "@/stores/subscriptions";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import styles from "./Home.module.css";
import { ProviderPane } from "./ProviderPane";
import { TonLogo } from "./TonLogo";

const SCROLL_TOP_THRESHOLD = 360;
const TABS = ["subs", "list", "fav"] as const;
const SECTIONS = "home";

export function Home() {
  const { t } = useTranslation();
  const locale = locales[useAppliedLang()];
  const { labels } = useUi();
  const navigate = useNavigate();

  const providers = useCatalog((s) => s.providers);
  const status = useCatalog((s) => s.status);
  const errorStatus = useCatalog((s) => s.errorStatus);
  const load = useCatalog((s) => s.load);
  const reload = useCatalog((s) => s.reload);

  const tab = useCatalogQuery((s) => s.tab);
  const search = useCatalogQuery((s) => s.search);
  const sort = useCatalogQuery((s) => s.sort);
  const filters = useCatalogQuery((s) => s.filters);
  const setTab = useCatalogQuery((s) => s.setTab);
  const setSearch = useCatalogQuery((s) => s.setSearch);
  const resetFilters = useCatalogQuery((s) => s.resetFilters);

  const favorites = useFavorites((s) => s.favorites);
  const names = useNames((s) => s.providers);
  const loggedIn = useAuth((s) => s.loggedIn);
  const subscribed = useSubscriptions((s) => s.subscribed);

  const panes = useRef<Record<string, HTMLDivElement | null>>({});
  const [progress, setProgress] = useState(TABS.indexOf(tab));
  const [showTop, setShowTop] = useState(false);
  const scrubRef = useRef<(position: number | null) => void>(() => {});

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setShowTop((panes.current[tab]?.scrollTop ?? 0) > SCROLL_TOP_THRESHOLD);
  }, [tab]);

  const listItems = useMemo(
    () => selectCatalog(providers, { only: null, search, filters, sort, names }),
    [providers, search, filters, sort, names],
  );
  // Hand-picked tabs ignore the catalogue filters: they would hide the provider somebody came for.
  const favItems = useMemo(
    () => selectCatalog(providers, { only: favorites, search, filters: {}, sort, names }),
    [providers, favorites, search, sort, names],
  );
  const subItems = useMemo(
    () => (loggedIn ? selectCatalog(providers, { only: subscribed, search, filters: {}, sort, names }) : []),
    [loggedIn, providers, subscribed, search, sort, names],
  );

  const ranks = useMemo(() => rankInFilters(providers, filters), [providers, filters]);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const listRows = useMemo(() => listItems.slice(0, limit), [listItems, limit]);

  const filtersTouched = !isStart(filters);
  // Skeletons only while there is nothing to show: a refresh runs through the same "loading"
  // status, and a screenful of placeholders over a scrolled list threw it back, 6000px to 547px.
  const loading = status !== "ready" && status !== "error" && providers.length === 0;
  const subsLoading = loggedIn && loading && subscribed.length > 0;
  const favLoading = loading && favorites.length > 0;
  const isError = status === "error" && providers.length === 0;

  // Retry after a failed load: data refreshes itself on focus and on a tick, so this is the only
  // thing left that asks for it by hand.
  const onReload = () => {
    void reload().then((ok) => {
      if (!ok) notify("error");
    });
    if (useAuth.getState().session === "open") {
      hydrateFromServer().catch((error: unknown) => console.error("retry sync failed", error));
    }
  };

  const onPaneScroll = (paneTab: Tab, scrollTop: number) => {
    if (paneTab === tab) setShowTop(scrollTop > SCROLL_TOP_THRESHOLD);
  };

  const scrollToTop = () => {
    panes.current[tab]?.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
    setShowTop(false);
  };

  // The provider opened last keeps its row marked once its sheet closes, as on the sites.
  const [viewed, setViewed] = useState<string | null>(null);
  const openProvider = (pubkey: string) => {
    setViewed(pubkey);
    navigate(`/provider/${pubkey}`);
  };

  const listHero = <Callout leading={<TonLogo />} title={t("mainTitle")} desc={t("mainDesc")} />;

  const subsHero = <Callout icon={Bell} title={t("subsTitle")} desc={t("subsDesc")} />;

  const favHero = <Callout icon={Star} title={t("favTitle")} desc={t("favDesc")} />;

  const toolbar = (withFilters: boolean) => (
    <div className={styles.toolbar}>
      <Button className={styles.toolbarBtn} onClick={() => navigate("/sort")}>
        {sort.dir === "asc" ? (
          <ArrowUp className={styles.toolbarIcon} aria-hidden="true" />
        ) : (
          <ArrowDown className={styles.toolbarIcon} aria-hidden="true" />
        )}
        {locale.sortFields[sort.field]}
      </Button>
      {withFilters && (
        <Button
          variant={filtersTouched ? "primary" : "secondary"}
          className={styles.toolbarBtn}
          onClick={() => navigate("/filters")}
        >
          <SlidersHorizontal className={styles.toolbarIcon} aria-hidden="true" />
          {t("filters")}
        </Button>
      )}
    </div>
  );

  const listToolbar = (listItems.length > 0 || loading) && toolbar(true);

  const favToolbar = (favItems.length > 0 || favLoading) && toolbar(false);

  const subsToolbar = (subItems.length > 0 || subsLoading) && toolbar(false);

  const query = search.trim();

  const marks = {
    subs: { icon: Bell, title: t("subsTitle") },
    list: { leading: <TonLogo />, title: t("mainTitle") },
    fav: { icon: Star, title: t("favTitle") },
  };

  const actionButton = (label: string, onClick: () => void) => (
    <Button variant="primary" size="xl" block onClick={onClick}>
      {label}
    </Button>
  );

  const state = (key: Tab, desc: ReactNode, action?: ReactNode) => (
    <Callout {...marks[key]} desc={desc}>
      {action}
    </Callout>
  );

  const errorState = (key: Tab) =>
    state(key, errorStatus !== null ? `${t("loadError")} (HTTP ${errorStatus})` : t("loadError"), actionButton(labels.retry, onReload));

  const searchState = (key: Tab) =>
    state(key, t("searchEmpty"), listItems.length > 0 ? actionButton(t("searchInCatalog", { count: listItems.length }), () => setTab("list")) : undefined);

  const pane = (key: Tab) => {
    if (key === "subs") {
      return (
        <ProviderPane
          hero={subItems.length > 0 || subsLoading ? subsHero : undefined}
          toolbar={subsToolbar}
          count={loggedIn && subItems.length > 0 ? t("found", { count: subItems.length }) : null}
          loading={subsLoading}
          skeletonCount={Math.min(subscribed.length, COLD_ROWS)}
          rows={subItems}
          ranks={ranks}
          fallback={
            !loggedIn ? (
              state("subs", t("loginNeeded"), <TelegramLoginButton />)
            ) : isError ? (
              errorState("subs")
            ) : query ? (
              searchState("subs")
            ) : subscribed.length === 0 ? (
              state("subs", t("subsEmpty"), actionButton(t("findProviders"), () => setTab("list")))
            ) : (
              state("subs", t("goneFromCatalog"))
            )
          }
          viewed={viewed}
          onOpen={openProvider}
        />
      );
    }

    if (key === "fav") {
      return (
        <ProviderPane
          hero={favItems.length > 0 || favLoading ? favHero : undefined}
          toolbar={favToolbar}
          count={favItems.length > 0 ? t("found", { count: favItems.length }) : null}
          loading={favLoading}
          skeletonCount={Math.min(favorites.length, COLD_ROWS)}
          rows={favItems}
          ranks={ranks}
          fallback={
            isError ? (
              errorState("fav")
            ) : query ? (
              searchState("fav")
            ) : favorites.length === 0 ? (
              state("fav", t("favEmpty"), actionButton(t("findProviders"), () => setTab("list")))
            ) : (
              state("fav", t("goneFromCatalog"))
            )
          }
          viewed={viewed}
          onOpen={openProvider}
        />
      );
    }

    return (
      <ProviderPane
        hero={listItems.length > 0 || loading ? listHero : undefined}
        toolbar={listToolbar}
        loading={loading}
        skeletonCount={COLD_ROWS}
        rows={listRows}
        more={
          <ShowMore shown={listRows.length} total={listItems.length} onMore={() => setLimit((shown) => shown + PAGE_SIZE)} />
        }
        ranks={ranks}
        fallback={
          isError ? (
            errorState("list")
          ) : query ? (
            searchState("list")
          ) : (
            state("list", t("providersNotFound"), filtersTouched ? actionButton(labels.reset, resetFilters) : undefined)
          )
        }
        viewed={viewed}
        onOpen={openProvider}
      />
    );
  };

  return (
    <div className={styles.screen}>
      <nav className={styles.nav}>
        <Field
          glyph="search"
          value={search}
          onChange={setSearch}
          placeholder={tab === "subs" ? t("searchSubs") : tab === "fav" ? t("searchFav") : t("searchPlaceholder")}
        />
        <div className={styles.navActions}>
          <IconButton label={t("settings")} variant="secondary" size="xl" onClick={() => navigate("/menu")}>
            <Menu className={glyphClass("md")} color="var(--text-2)" />
          </IconButton>
        </div>
      </nav>

      <TabPager
        ids={SECTIONS}
        tabs={TABS}
        tab={tab}
        scrubRef={scrubRef}
        panes={panes}
        onTabChange={setTab}
        onProgress={setProgress}
        onPaneScroll={onPaneScroll}
      >
        {pane}
      </TabPager>

      <IconButton
        label={labels.goUp}
        variant="primary"
        size="lg"
        aria-hidden={!showTop}
        tabIndex={showTop ? 0 : -1}
        className={cx(styles.fab, showTop && styles.fabVisible)}
        onClick={scrollToTop}
      >
        <ArrowUp className={glyphClass("md")} color="var(--btn-ink)" />
      </IconButton>

      <TabDock
        tabs={SECTIONS}
        items={[
          { key: "subs", label: t("subs"), icon: Bell },
          { key: "list", label: t("list"), icon: ProviderIcon },
          { key: "fav", label: t("fav"), icon: Star },
        ]}
        value={tab}
        progress={progress}
        onChange={setTab}
        onScrub={(position) => scrubRef.current(position)}
      />
    </div>
  );
}
