<?php

declare(strict_types=1);

namespace Drupal\tac_breadcrumbs\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Config\ConfigFactoryInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Menu\MenuActiveTrailInterface;
use Drupal\Core\Menu\MenuLinkManagerInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\Url;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a breadcrumb block based on a module-configured menu.
 *
 * The menu and separator are configured module-wide at
 * /admin/config/user-interface/tac-breadcrumbs so the block itself carries no
 * per-instance configuration and can be placed directly in Drupal Canvas.
 *
 * @Block(
 *   id = "tac_breadcrumb_block",
 *   admin_label = @Translation("TAC Breadcrumbs"),
 *   category = @Translation("TAC"),
 * )
 */
final class TacBreadcrumbBlock extends BlockBase implements ContainerFactoryPluginInterface {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    private readonly EntityTypeManagerInterface $entityTypeManager,
    private readonly MenuLinkManagerInterface $menuLinkManager,
    private readonly MenuActiveTrailInterface $menuActiveTrail,
    private readonly ConfigFactoryInterface $configFactory,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition): static {
    return new static(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager'),
      $container->get('plugin.manager.menu.link'),
      $container->get('menu.active_trail'),
      $container->get('config.factory'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getCacheContexts(): array {
    return array_merge(parent::getCacheContexts(), ['url.path']);
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $config = $this->configFactory->get('tac_breadcrumbs.settings');

    return [
      '#theme' => 'tac_breadcrumbs',
      '#breadcrumb' => $this->buildBreadcrumb((string) $config->get('menu')),
      '#separator' => $config->get('separator'),
      '#cache' => [
        'tags' => $config->getCacheTags(),
      ],
    ];
  }

  private function buildBreadcrumb(string $menuId): array {
    $breadcrumb = [
      [
        'text' => $this->t('Home'),
        'url' => Url::fromRoute('<front>')->toString(),
        'is_current' => FALSE,
      ],
    ];

    $menu = $menuId ? $this->entityTypeManager->getStorage('menu')->load($menuId) : NULL;
    if (!$menu) {
      return $breadcrumb;
    }

    $trailIds = array_values(array_filter($this->menuActiveTrail->getActiveTrailIds($menu->id())));
    $trailIds = array_reverse($trailIds);

    // Resolve links first so front-page links can be skipped: the "Home" crumb
    // is already added above, so a menu link pointing at the front page would
    // otherwise render a duplicate Home.
    $links = [];
    foreach ($trailIds as $pluginId) {
      $link = $this->menuLinkManager->createInstance($pluginId);
      $url = $link->getUrlObject();
      if ($url->isRouted() && $url->getRouteName() === '<front>') {
        continue;
      }
      $links[] = $link;
    }

    foreach ($links as $index => $link) {
      $isLast = $index === array_key_last($links);
      // Only the final crumb is the current page. Non-final links without a
      // real destination (e.g. <nolink>/<none> parents) render as plain text.
      $url = $isLast ? '' : $link->getUrlObject()->toString();
      $breadcrumb[] = [
        'text' => $link->getTitle(),
        'url' => $url !== '' ? $url : NULL,
        'is_current' => $isLast,
      ];
    }

    return $breadcrumb;
  }

}
